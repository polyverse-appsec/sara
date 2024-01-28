'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from './../auth'
import { kv } from '@vercel/kv'
import { Assistant } from 'openai/resources/beta/assistants/assistants'

import {
  Organization,
  Project,
  Repository,
  Task,
  User,
  type Chat,
} from './../lib/dataModelTypes'
import {
  stripUndefinedObjectProperties,
  tickleRepository,
} from './../lib/polyverse/backend/backend'
import {
  fetchOrganizationRepositories,
  fetchUserOrganizations,
  getOrCreateRepoFromGithubRepo,
} from './../lib/polyverse/github/repos'
import { configAssistant } from './../lib/polyverse/openai/assistants'
import { createNewProjectFromRepository } from './../lib/polyverse/project/project'
import { nanoid } from './../lib/utils'

const TEN_MINS_IN_MILLIS = 600000

export async function createChat() {

}

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

export async function removeChat({ id, taskId, path }: { id: string; taskId: string, path: string }) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized',
    }
  }

  let uid = await kv.hget<string>(`chat:${id}`, 'userId')

  // Hmmm... This is strange. We ask back from Redis the user ID as a string but
  // the auth conditional below will repeatedly fail as we are using an absolute
  // truthy statement and UID happens to be a `number` instead of a `string` at
  // runtime. I looked at it appears that when we preserve this `userId` it is
  // as a string but maybe Redis doesn't preserve types? Or maybe a chat was
  // created earlier in prototyping phase before launch as a `number`? Anyways
  // we convert a string and this behavior is something to look for in the
  // future.
  if (typeof uid === 'number') {
    uid = '' + uid
  }

  if (uid !== session?.user?.id) {
    return {
      error: 'Unauthorized',
    }
  }

  await kv.del(`chat:${id}`)
  await kv.zrem(`task:chats:${taskId}`, `chat:${id}`)

  revalidatePath('/')
  return revalidatePath(path)
}

export async function clearChats() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized',
    }
  }

  /*
 BUGBUG come back to this
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
*/
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
      error: 'Unauthorized',
    }
  }

  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || chat.userId !== session.user.id) {
    return {
      error: 'Something went wrong',
    }
  }

  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`,
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
    accessToken: session.accessToken,
  })
  return orgs
}

export async function getRepositoriesForOrg(
  org: string,
): Promise<Repository[]> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  const repos = await fetchOrganizationRepositories({
    accessToken: session.accessToken,
    org,
  })

  //IMPORTANT note:  the repo's returned from fetchOrganizationRepositories are github repos, and may be missing extra information we have
  //so loop through the repos and either lookup or create the repo data stucture in out system
  const fullRepos = []
  for (const repo of repos) {
    const fullRepo = await getOrCreateRepoFromGithubRepo(repo, session.user.id)
    fullRepos.push(fullRepo)
  }
  return fullRepos
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
    createdAt,
  }

  // We are being defensive here so we don't blow up the KV store when writing.
  // Correct thing to do would be to identify where we are putting 'undefined'
  // properties on the object we are writing and fix the logic.
  stripUndefinedObjectProperties(taskData)

  await kv.hset(`task:${id}`, taskData)

  await kv.zadd(`user:tasks:${session.user.id}`, {
    score: +createdAt,
    member: `task:${id}`,
  })

  await kv.zadd(`repo:tasks:${task.projectId}`, {
    score: +createdAt,
    member: `task:${id}`,
  })

  return taskData
}

const createRepoTasksRepoIDKey = (repoID: string) => `repo:tasks:${repoID}`
const createUserTasksUserIDKey = (userID: string) => `user:tasks:${userID}`
const createTaskTaskIDKey = (taskID: string) => `task:${taskID}`

export const getTasksAssociatedWithProject = async (
  project: Project,
): Promise<Task[]> => {
  const session = await auth()

  if (!session?.user?.id || session.user.id !== project.userId) {
    throw new Error('Unauthorized')
  }

  // First start by getting all of tasks associated with a user...
  const key = createRepoTasksRepoIDKey(project.id)
  const taskKeys = (await kv.zrange(key, 0, -1)) as string[]

  if (taskKeys.length === 0) {
    return []
  }

  // Then get all of the tasks for the user based on the retrieved IDs...
  const taskPipeline = kv.pipeline()
  taskKeys.forEach((taskKey) => taskPipeline.hgetall(taskKey))

  const tasks = (await taskPipeline.exec()) as Task[]

  return tasks
}

export async function getTask(
  taskId: string,
  userId: string,
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
 * Project related functions
 */

/**
 * Server action that retrieves the most recent persisted information about a
 * specific project identified in the `repo.full_name` data member. If the
 * repository doesn't exist then persists any information contained within the
 * fully formed `repo` parameter.
 *
 * @param {Project} proj Object instance of a repo. Must be fully formed in
 * the event the projcect doesn't exist and is to be created.
 * @param {string} userId The ID of the user who is authorized to retrieve or
 * persist the repo name.
 * @returns {Project} Retrieved or persisted repository info.
 */
export async function getOrCreateProjectFromRepository(
  repo: Repository,
  user: User,
): Promise<Project | null> {
  // Rather than delegate auth to functions we consume we protect ourselves and
  // do a check here before we consume each method as well in case there are any
  // behavioral changes to said consumed functions.
  const session = await auth()

  // Apply business logic auth check for `getRepository`
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  //go through the user.projects array and see if we have a project with the same name as the repo

  const retrievedProject = await getProject(
    `project:${repo.full_name}:${user.id}`,
  )

  if (retrievedProject) {
    return retrievedProject
  }

  const newProj = await createNewProjectFromRepository(repo, user)
  return newProj
}

/*
  retrieve a project from the KV store
 */
export async function getProject(projectKey: string): Promise<Project | null> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const project = await kv.hgetall<Project>(projectKey)

  if (!project) {
    return null
  }

  return project
}

/**
 *
 * CAUTION: Only call this API with a fully formed repository object. If you
 * call this API with a partially formed repository object it will clobber the
 * existing repository object with the partially formed one.
 *
 * @param {Project} repo Fully formed instance of Repository object to
 * update.
 * @returns {Project} The updated repository object.
 */
export async function updateRepo(repo: Repository): Promise<Repository> {
  const session = await auth()

  if (!session?.user?.id || repo.userId !== session.user.id) {
    throw new Error('Unauthorized')
  }
  await kv.hset(repo.id, repo)

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
  repoFullName: string,
  userId: string,
): Promise<Repository | null> {
  const session = await auth()

  if (!session?.user?.id || userId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  const repoKey = `repository:${repoFullName}:${userId}`
  const repo = await kv.hgetall<Repository>(repoKey)

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
  userId: string,
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

export async function tickleReposForProjectChange(
  repos: Repository[],
) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  //for all of the repos in the project, tickle them, this can be done in parallel
  //await all of the tickle promises
  const ticklePromises = []
  for (const repo of repos) {
    ticklePromises.push(tickleRepository(repo, session.user.email || ''))
  }
  await Promise.all(ticklePromises)
}

export async function getOrCreateAssistantForProject(
  project: Project,
  repos: Repository[],
): Promise<Assistant | null> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  if (!project.assistant) {
    //we don't have an assistant, so create one
    return await configAssistant(project, repos, session.user.email || '')
  }
  return null
}

/*
 * User object related functions
 *
 */
export async function getOrCreateUserFromSession(session: any): Promise<User> {
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const user = await getUser(session.user.id)

  if (user) {
    return user
  }

  return await createUser(session.user)
}

export async function getUser(userId: string): Promise<User | null> {
  const user = await kv.hgetall<User>(`user:${userId}`)

  if (!user) {
    return null
  }

  return user
}

export async function createUser(user: User): Promise<User> {
  const session = await auth()

  if (!session?.user?.id || user.id !== session.user.id) {
    throw new Error('Unauthorized')
  }

  //note that most fields of user will be empty except those in the session object

  await kv.hset(`user:${user.id}`, user)

  return user
}
