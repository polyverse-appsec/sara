/*
 * project.ts
 *
 * helper functions for the Project class
 */

import { kv } from '@vercel/kv'

import { Project, Repository, User } from '@/lib/dataModelTypes'
import { createDefaultProjectTask } from '@/lib/polyverse/task/task'

export async function createNewProjectFromRepository(
  repo: Repository,
  user: User,
): Promise<Project> {
  let project = {} as Project

  project.id = `project:${repo.full_name}:${user.id}`
  project.name = repo.full_name
  project.description = repo.description
  project.userId = user.id
  project.mainRepositoryId = repo.id
  project.referenceRepositories = []
  project.tasks = []

  const defaultTask = await createDefaultProjectTask(project, user.id)

  project.defaultTask = defaultTask

  await kv.hset(project.id, project)
  return project
}
