/*
 * project.ts
 *
 * helper functions for the Project class
 */

import { kv } from '@vercel/kv'
import { configAssistantForProject } from 'app/_actions/config-assistant-for-project'
import { getFileInfoForProject } from 'app/_actions/get-file-info-for-repo'

import { Organization, Project, Repository, User } from '../../data-model-types'
import { userProjectIdsSetKey, userProjectKey } from '../db/keys'
import { createDefaultProjectTask } from './../task/task'

export async function createNewProject(
  projectName: string,
  primaryDataSource: Repository,
  secondaryDataSources: Repository[],
  user: User,
): Promise<Project> {
  const projectId = `project:${projectName}:${user.id}`
  console.log(`PROJECT NAME IS ${projectName}`)

  let project = {} as Project

  project.id = projectId
  project.name = projectName
  project.description = primaryDataSource.description
  project.userId = user.id
  // TODO: Change `mainRepositoryId` -> `primaryDataSourceId` per data model design
  project.mainRepository = primaryDataSource
  // TODO: Change `referenceRepositories` -> `secondaryDataSourceIds` per data model design
  project.referenceRepositories = secondaryDataSources
  project.tasks = []

  const defaultTask = await createDefaultProjectTask(project, user.id)

  project.defaultTask = defaultTask

  const setKey = userProjectIdsSetKey(user.id)
  const itemKey = userProjectKey(user.id, projectId)

  await kv.hset(itemKey, project)
  await kv.zadd(setKey, {
    score: +new Date(),
    member: itemKey,
  })

  return project
}
