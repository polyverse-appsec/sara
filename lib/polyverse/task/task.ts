// Import necessary types and functions
import { Task, User, Repository } from '@/lib/types'
import { createTask } from '@/app/actions'

// Utility to create a default task for a repository
export async function createDefaultRepositoryTask(
  repo: Repository
): Promise<Task> {
  const defaultTask: Task = {
    id: '', // Generate an ID or leave it for the createTask function to handle
    title: `Task for ${repo.name}`,
    description: `Default task for repository ${repo.name}`,
    createdAt: new Date(),
    userId: repo.orgId, // Assuming the orgId represents the user who owns this repo
    repositoryId: repo.id,
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
    createdAt: new Date(),
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
