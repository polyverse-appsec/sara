/*
 * project.ts
 *
 * helper functions for the Project class
 */

import { kv } from '@vercel/kv'

import { Project, Repository, User } from '../../data-model-types'
import { createDefaultProjectTask } from './../task/task'
import { userProjectIdsSetKey, userProjectKey } from '../db/keys'

export async function createNewProject(
  projectName: string,
  primaryDataSource: Repository,
  secondaryDataSources: Repository[],
  user: User,
): Promise<Project> {
  const projectId = `project:${primaryDataSource.full_name}:${user.id}`

  let project = {} as Project

  project.id = projectId
  project.name = projectName
  project.description = primaryDataSource.description
  project.userId = user.id
  // TODO: Change `mainRepositoryId` -> `primaryDataSourceId` per data model design
  project.mainRepositoryId = primaryDataSource.id
  // TODO: Change `referenceRepositories` -> `secondaryDataSourceIds` per data model design
  project.referenceRepositoriesIds = secondaryDataSources.map(secondaryDataSource => secondaryDataSource.id)
  project.tasks = []

  const defaultTask = await createDefaultProjectTask(project, user.id)

  project.defaultTask = defaultTask

  const setKey = userProjectIdsSetKey(user.id)
  const itemKey = userProjectKey(user.id, projectId)

  await kv.hset(itemKey, project)
  await kv.zadd(setKey, {
    score: +new Date(),
    member: itemKey
  })

  return project
}
