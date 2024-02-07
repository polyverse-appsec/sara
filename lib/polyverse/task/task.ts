// Import necessary types and functions
import { Project, Repository, Task, User } from '../../data-model-types'
import { createTask } from './../../../app/_actions/create-task'

// Utility to create a default task for a repository

/**
 * Creates a default repository task. Note that the repo doesn't have the task
 * associated with it after calling this.
 *
 * @param {Project} repo Repository to create the default task for
 * @param {string} userId User ID assocaited with the created repository
 * @returns {Promise<Task>} Created default task
 */
export async function createDefaultProjectTask(
  project: Project,
  userId: string,
): Promise<Task> {
  const defaultTask: Task = {
    id: '', // Generate an ID or leave it for the createTask function to handle
    title: `Default task for ${project.name}`,
    description: `Default task for project ${project.name}`,
    createdAt: new Date(),
    // TODO: Commented out for 1/4 Thursday demo - Was hitting auth error in `createTask`
    // on the following logic: if (!session?.user?.id || task.userId !== session.user.id)
    // For the demo we are setting the userId as the owner of this task
    // userId: repo.orgId, // Assuming the orgId represents the user who owns this repo
    userId,
    projectId: project.id,
    chats: [],
    subtasks: [],
  }

  return createTask(defaultTask)
}

// Utility to create a default task for a user
export async function createDefaultUserTask(user: User): Promise<Task> {
  const defaultTask: Task = {
    id: '', // Generate an ID or leave it for the createTask function to handle
    title: `Task for ${user.username}`,
    description: `Default task for user ${user.username}`,
    createdAt: new Date(),
    userId: user.id,
    projectId: '', // Set this if you have a default repository for the user
    chats: [],
    subtasks: [],
  }

  if (user.defaultTask) {
    return user.defaultTask // Return the existing default task if it exists
  }

  return createTask(defaultTask)
}
