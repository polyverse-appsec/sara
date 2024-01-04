'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { kv } from '@vercel/kv'

import { auth } from '@/auth'
import { type Chat } from '@/lib/types'
import {
  fetchUserOrganizations,
  fetchOrganizationRepositories
} from '@/lib/polyverse/github/repos'
import { Organization, Repository, Task } from '@/lib/types'
import { nanoid } from '@/lib/utils'
import { createDefaultRepositoryTask } from '@/lib/polyverse/task/task'

export async function getChats(userId?: string | null, taskId?: string) {
  if (!userId) {
    return []
  }

  try {
    const pipeline = kv.pipeline()
    //if we have a taskId, get the chats associated with that task, otherwise get the chats associated with the user
    const chats: string[] = await kv.zrange(
      taskId ? `task:chats:${taskId}` : `user:chat:${userId}`,
      0,
      -1,
      {
        rev: true
      }
    )

    for (const chat of chats) {
      pipeline.hgetall(chat)
    }

    const results = await pipeline.exec()

    return results as Chat[]
  } catch (error) {
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

export async function getRepositoriesForOrg(
  org: string
): Promise<Repository[]> {
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

  await kv.hset(`task:${id}`, taskData)
  await kv.zadd(`user:tasks:${session.user.id}`, {
    score: +createdAt,
    member: `task:${id}`
  })

  return taskData
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
 * @param {Repository} repo Object instance of a repo. Must be fully formed in
 * the event the repo doesn't exist and is to be created.
 * @param {string} userId The ID of the user who is authorized to retrieve or
 * persist the repo name.
 * @returns {Repository} Retrieved or persisted repository info.
 */
export async function getOrCreateRepository(
  repo: Repository,
  userId: string
): Promise<Repository> {
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
  retrievedRepo: Repository,
  incomingRepo: Repository
): Promise<Repository> {
  //go through the fields of the incoming Repo, and for every non-null field, check to see if it matches the retrieved repo
  //if it's different, then set a flag to update the repo. Be sure not to clobber fields like the Assistant field,
  //as the incoming Repo will not have that field--just the github repo info
  let updateRepo = false
  for (const key in incomingRepo) {
    if (incomingRepo[key] && incomingRepo[key] !== retrievedRepo[key]) {
      updateRepo = true
      retrievedRepo[key] = incomingRepo[key]
    }
  }
  if (updateRepo) {
    const repoKey = buildRepositoryHashKey(retrievedRepo.full_name)
    await kv.hset(repoKey, retrievedRepo)
  }
  return retrievedRepo
}
/**
 * Hashes the fields of a repository object.
 *
 * @param {Repository} githubRepo Fully formed instance of Repository object.
 * @returns {Repository} The presisted repository object.
 */
export async function createRepositoryFromGithub(
  githubRepo: Repository
): Promise<Repository> {
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
 * @param {Repository} repo Fully formed instance of Repository object to
 * update.
 * @returns {Repository} The updated repository object.
 */
export async function updateRepo(repo: Repository): Promise<Repository> {
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
): Promise<Repository | null> {
  const session = await auth()

  if (!session?.user?.id || userId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  const repoKey = buildRepositoryHashKey(fullRepoName)
  const repo = await kv.hgetall<Repository>(repoKey)

  // Per our current implementation of our types we assume that the `orgId`
  // matches the ID of the user that owns the repo
  // if (!repo || repo.orgId !== session.user.id) {
  //   return null
  // }

  return repo
}
