// Import necessary types and functions
import { Task, User, Repository } from '@/lib/polyverse/data-model/dataModelTypes'
import { createTask, getRepository, getTask, updateRepo } from '@/app/actions'

/**
 * Performs a deep copy of an instance of a Repository.
 *
 * @param {Repository} repo Repo to copy
 * @returns {Repository} Deep copy of repo
 */
const deepCopyRepo = (repo: Repository): Repository =>
  JSON.parse(JSON.stringify(repo)) as Repository

/**
 * Checks to see if a repository has a default task and if it doesn't creates
 * one. If one should exist it returns the default task as part of the provided
 * repo.
 *
 * @param {Repository} repo Repository with filled in default task ID to search
 * on.
 * @param {string} userId ID of user whom this repository object has been
 * created for.
 * @returns {Promise<Repository>} Deep copied instance of the repository with
 * the default task set on it.
 */
export async function configDefaultRepositoryTask(
  repo: Repository,
  userId: string
): Promise<Repository> {
  // Check to see if there is a task associated with the repo provided as a
  // parameter.
  if (repo.defaultTask?.id) {
    const existingDefaultTask = await getTask(repo.defaultTask.id, userId)

    // If default task does exist provide a deep copy of the repo and add the
    // default task as a reference
    if (existingDefaultTask) {
      const copiedRepo = deepCopyRepo(repo)
      copiedRepo.defaultTask = existingDefaultTask

      return copiedRepo
    }
  }

  // At this point we know there isn't a default task so create one now
  const newDefaultTask = await createDefaultRepositoryTask(repo, userId)

  const copiedRepo = deepCopyRepo(repo)
  copiedRepo.defaultTask = newDefaultTask

  // Ensure we update the repo with the default task
  return await updateRepo(copiedRepo)
}

// Utility to create a default task for a repository

/**
 * Creates a default repository task. Note that the repo doesn't have the task
 * associated with it after calling this.
 *
 * @param {Repository} repo Repository to create the default task for
 * @param {string} userId User ID assocaited with the created repository
 * @returns {Promise<Task>} Created default task
 */
export async function createDefaultRepositoryTask(
  repo: Repository,
  userId: string
): Promise<Task> {
  const defaultTask: Task = {
    id: '', // Generate an ID or leave it for the createTask function to handle
    title: `Task for ${repo.name}`,
    description: `Default task for repository ${repo.name}`,
    createdAt: Date.now(),
    // TODO: Commented out for 1/4 Thursday demo - Was hitting auth error in `createTask`
    // on the following logic: if (!session?.user?.id || task.userId !== session.user.id)
    // For the demo we are setting the userId as the owner of this task
    // userId: repo.orgId, // Assuming the orgId represents the user who owns this repo
    userId,
    repositoryId: repo.full_name,
    chats: [],
    subtasks: []
  }

  return createTask(defaultTask)
}

// Utility to create a default task for a user
export async function createDefaultUserTask(user: User): Promise<Task> {
  const defaultTask: Task = {
    id: '', // Generate an ID or leave it for the createTask function to handle
    title: `Task for ${user.username}`,
    description: `Default task for user ${user.username}`,
    createdAt: Date.now(),
    userId: user.id,
    repositoryId: '', // Set this if you have a default repository for the user
    chats: [],
    subtasks: []
  }

  if (user.defaultTask) {
    return user.defaultTask // Return the existing default task if it exists
  }

  return createTask(defaultTask)
}
