'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { kv } from '@vercel/kv'

import { auth } from '@/auth'
import { type Chat } from '@/lib/dataModelTypes'
import {
  fetchUserOrganizations,
  fetchOrganizationRepositories
} from '@/lib/polyverse/github/repos'
import { Organization, Project, Task } from '@/lib/dataModelTypes'
import { nanoid } from '@/lib/utils'
import { createDefaultRepositoryTask } from '@/lib/polyverse/task/task'
import { tickleProject } from '@/lib/polyverse/backend/backend'
import { config } from 'process'
import { Assistant } from 'openai/resources/beta/assistants/assistants'
import { configAssistant } from '@/lib/polyverse/openai/assistants'
import { stripUndefinedObjectProperties } from '@/lib/polyverse/backend/backend'

const TEN_MINS_IN_MILLIS = 600000

export async function getChats(taskId?: string | null) {
  if (!taskId) {
    return []
  }

  try {
    const pipeline = kv.pipeline()

    //if we have a taskId, get the chats associated with that task, otherwise get the chats associated with the user
    const taskChatsKey = `task:chats:${taskId}`
    const dateScoreInMillis = Date.now() + TEN_MINS_IN_MILLIS

    // The original implementation of this based on
    // https://github.com/vercel/ai-chatbot had a call of `zrange` with the
    // `rev` option set to true and the indexes of (0, -1). For some reason
    // this wouldn't return results for us. I believe that it may have to be
    // with the score we assign which is millis since epoch. Something to look
    // into in the future.
    //
    // Either way we don't reverse anymore and we query for all elements of the
    // `task:chats:{taskId}` and we do a reverse of the results ourselves. This
    // ought to return similar results as if we used the `rev` option with the
    // indexes of (0, -1) since it is unlikely there will be collisions of the
    // scores since we are in milliseconds.
    //
    // Note this depends on NTP being correctly configured on the host as well.
    let chats: string[] = await kv.zrange(taskChatsKey, 0, dateScoreInMillis)

    if (!chats.length) {
      return []
    }

    chats.reverse()

    for (const chat of chats) {
      pipeline.hgetall(chat)
    }

    const results = await pipeline.exec()

    return results as Chat[]
  } catch (error) {
    console.error('Error getting chats: ', error)
    return []
  }
}

export async function getChat(id: string, userId: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || (userId && chat.userId !== userId)) {
    return null
  }

  return chat
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  const uid = await kv.hget<string>(`chat:${id}`, 'userId')

  if (uid !== session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  await kv.del(`chat:${id}`)
  if (session.activeTask?.id) {
    await kv.zrem(`task:chats:${session.activeTask?.id}`, `chat:${id}`)
  } else {
    await kv.zrem(`user:chat:${session.user.id}`, `chat:${id}`)
  }

  revalidatePath('/')
  return revalidatePath(path)
}

export async function clearChats() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }
  let key = `user:chat:${session.user.id}`
  if (session.activeTask?.id) {
    key = `task:chats:${session.activeTask?.id}`
  }
  const chats: string[] = await kv.zrange(key, 0, -1)
  if (!chats.length) {
    return redirect('/')
  }
  const pipeline = kv.pipeline()

  for (const chat of chats) {
    pipeline.del(chat)
    pipeline.zrem(`user:chat:${session.user.id}`, chat)
  }

  await pipeline.exec()

  revalidatePath('/')
  return redirect('/')
}

export async function getSharedChat(id: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || chat.userId !== session.user.id) {
    return {
      error: 'Something went wrong'
    }
  }

  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`
  }

  await kv.hset(`chat:${chat.id}`, payload)

  return payload
}

/*
 * Github related functions
 */

export async function getOrganizations(): Promise<Organization[]> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const orgs = await fetchUserOrganizations({
    accessToken: session.accessToken
  })
  return orgs
}

export async function getRepositoriesForOrg(org: string): Promise<Project[]> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  const repos = await fetchOrganizationRepositories({
    accessToken: session.accessToken,
    org
  })
  return repos
}

/*
 * Task related functions
 */
export async function createTask(task: Task): Promise<Task> {
  const session = await auth()

  if (!session?.user?.id || task.userId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  const id = task.id || nanoid()
  const createdAt = task.createdAt || new Date()
  const taskData = {
    ...task,
    id,
    createdAt
  }

  // We are being defensive here so we don't blow up the KV store when writing.
  // Correct thing to do would be to identify where we are putting 'undefined'
  // properties on the object we are writing and fix the logic.
  stripUndefinedObjectProperties(taskData)

  await kv.hset(`task:${id}`, taskData)

  await kv.zadd(`user:tasks:${session.user.id}`, {
    score: +createdAt,
    member: `task:${id}`
  })

  await kv.zadd(`repo:tasks:${task.repositoryId}`, {
    score: +createdAt,
    member: `task:${id}`
  })

  return taskData
}

const createRepoTasksRepoIDKey = (repoID: string) => `repo:tasks:${repoID}`
const createUserTasksUserIDKey = (userID: string) => `user:tasks:${userID}`
const createTaskTaskIDKey = (taskID: string) => `task:${taskID}`

export const getTasksAssociatedWithRepo = async (
  repoID: string
): Promise<Task[]> => {
  const session = await auth()

  // BUGBUG: Ummmmm This is bad - Turning off for demo purposes but we need to
  // be able to pass in user ID for this method from the client side when we
  // invoke it but I don't think we figured out how to pass that info around yet
  // if (!session?.user?.id || session.user.id !== userID) {
  //   throw new Error('Unauthorized')
  // }

  // First start by getting all of tasks associated with a user...
  const key = createRepoTasksRepoIDKey(repoID)
  const taskKeys = (await kv.zrange(key, 0, -1)) as string[]

  if (taskKeys.length === 0) {
    return []
  }

  // Then get all of the tasks for the user based on the retrieved IDs...
  const taskPipeline = kv.pipeline()
  taskKeys.forEach(taskKey => taskPipeline.hgetall(taskKey))

  const tasks = (await taskPipeline.exec()) as Task[]

  return tasks
}

export async function getTask(
  taskId: string,
  userId: string
): Promise<Task | null> {
  const session = await auth()

  if (!session?.user?.id || userId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  const task = await kv.hgetall<Task>(`task:${taskId}`)

  if (!task || task.userId !== userId) {
    return null
  }

  return task
}

/*
 * Repository related functions
 */

/**
 * Builds the hash key for persisting and retrieving repository fields.
 *
 * @param {string} fullRepoName Full name of the repository
 * @returns Hash key for repository.
 */
const buildRepositoryHashKey = (fullRepoName: string) =>
  `repository:${fullRepoName}`

/**
 * Server action that retrieves the most recent persisted information about a
 * specific repository identified in the `repo.full_name` data member. If the
 * repository doesn't exist then persists any information contained within the
 * fully formed `repo` parameter.
 *
 * @param {Project} repo Object instance of a repo. Must be fully formed in
 * the event the repo doesn't exist and is to be created.
 * @param {string} userId The ID of the user who is authorized to retrieve or
 * persist the repo name.
 * @returns {Project} Retrieved or persisted repository info.
 */
export async function getOrCreateRepositoryFromGithub(
  repo: Project,
  userId: string
): Promise<Project> {
  // Rather than delegate auth to functions we consume we protect ourselves and
  // do a check here before we consume each method as well in case there are any
  // behavioral changes to said consumed functions.
  const session = await auth()

  // Apply business logic auth check for `getRepository`
  if (!session?.user?.id || userId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  const retrievedRepo = await getRepository(repo.full_name, userId)

  if (retrievedRepo) {
    //do a quick check to see if the retrieved repo has the same data as the passed in repo
    //if it doesn't, then update the repo
    const verifiedRepo = await checkAndUpdateRepository(retrievedRepo, repo)
    return verifiedRepo
  }

  return await createRepositoryFromGithub(repo)
}

async function checkAndUpdateRepository(
  retrievedRepo: Project,
  incomingGithubRepo: Project
): Promise<Project> {
  //go through the fields of the incoming Repo, and for every non-null field, check to see if it matches the retrieved repo
  //if it's different, then set a flag to update the repo. Be sure not to clobber fields like the Assistant field,
  //as the incoming Repo will not have that field--just the github repo info
  let updateRepo = false
  for (const key in incomingGithubRepo) {
    if (
      incomingGithubRepo[key] &&
      incomingGithubRepo[key] !== retrievedRepo[key]
    ) {
      updateRepo = true
      retrievedRepo[key] = incomingGithubRepo[key]
    }
  }
  console.log(`updateRepo: ${updateRepo}`)
  if (updateRepo) {
    const repoKey = buildRepositoryHashKey(retrievedRepo.full_name)
    await kv.hset(repoKey, retrievedRepo)
  }
  return retrievedRepo
}
/**
 * Hashes the fields of a repository object.
 *
 * @param {Project} githubRepo Fully formed instance of Repository object.
 * @returns {Project} The presisted repository object.
 */
export async function createRepositoryFromGithub(
  githubRepo: Project
): Promise<Project> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Per our current implementation of our types we assume that the `orgId`
  // matches the ID of the user that owns the repo
  // if (repo.orgId !== session.user.id) {
  //   throw new Error('Unauthorized')
  // }
  githubRepo.defaultTask = await createDefaultRepositoryTask(
    githubRepo,
    session.user.id
  )

  const repoKey = buildRepositoryHashKey(githubRepo.full_name)
  await kv.hset(repoKey, githubRepo)

  return githubRepo
}

/**
 * Updates a the fields of an existing repository object. Note that if the repo
 * doesn't yet exist then it will create the object as well based on current
 * implementation.
 *
 * CAUTION: Only call this API with a fully formed repository object. If you
 * call this API with a partially formed repository object it will clobber the
 * existing repository object with the partially formed one.
 *
 * @param {Project} repo Fully formed instance of Repository object to
 * update.
 * @returns {Project} The updated repository object.
 */
export async function updateRepo(repo: Project): Promise<Project> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // TODO: Should we just ahve a createOrUpdateRepo function? Is creating same behavior
  // as updating?

  // Per our current implementation of our types we assume that the `orgId`
  // matches the ID of the user that owns the repo
  // if (repo.orgId !== session.user.id) {
  //   throw new Error('Unauthorized')
  // }

  const repoKey = buildRepositoryHashKey(repo.full_name)
  await kv.hset(repoKey, repo)

  return repo
}

/**
 * Retrieves the fields of a repository if it exists. If not it returns `null`.
 *
 * @param {string} fullRepoName The full name of the repository to retrieve.
 * @param {string} userId The ID of the user that is authorized to retrieve the
 * details of the repository.
 * @returns {(Repositry|null)} The repository if it exists otherwise `null`.
 */
export async function getRepository(
  fullRepoName: string,
  userId: string
): Promise<Project | null> {
  const session = await auth()

  if (!session?.user?.id || userId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  const repoKey = buildRepositoryHashKey(fullRepoName)
  const repo = await kv.hgetall<Project>(repoKey)

  // Per our current implementation of our types we assume that the `orgId`
  // matches the ID of the user that owns the repo
  // if (!repo || repo.orgId !== session.user.id) {
  //   return null
  // }

  return repo
}

/*
 * getRepositoryFromId
 */
export async function getRepositoryFromId(
  repoId: string,
  userId: string
): Promise<Project | null> {
  const session = await auth()

  if (!session?.user?.id || userId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  const repoKey = `repository:${repoId}`
  const repo = await kv.hgetall<Project>(repoKey)

  // Per our current implementation of our types we assume that the `orgId`
  // matches the ID of the user that owns the repo
  // if (!repo || repo.orgId !== session.user.id) {
  //   return null
  // }

  return repo
}

/*
 * Sara AI related functions.  Note that these are interwined with the repository creation and update functions
 * but separated out to make it easier to follow the code.
 *
 */

export async function tickleProjectFromRepoChange(repo: Project) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  await tickleProject(repo, session.user.email || '')
}

export async function getOrCreateAssistantForRepo(
  repo: Project
): Promise<Assistant | null> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  if (!repo.assistant) {
    //we don't have an assistant, so create one
    return await configAssistant(repo, session.user.email || '')
  }
  return null
}
