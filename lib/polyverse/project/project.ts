/*
 * project.ts
 *
 * helper functions for the Project class
 */

import { kv } from '@vercel/kv'

import { Organization, Project, Repository, User } from '../../data-model-types'
import { createDefaultProjectTask } from './../task/task'
import { userProjectIdsSetKey, userProjectKey } from '../db/keys'
import { getFileInfoForProject } from 'app/_actions/get-file-info-for-repo'
import { configAssistantForProject } from 'app/_actions/config-assistant-for-project'

export async function createNewProject(
  projectName: string,
  primaryDataSource: Repository,
  secondaryDataSources: Repository[],
  user: User,
  org: Organization
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

  // moved assistant creation logic here so it would get added to vercel k/v
  const fileInfos = await getFileInfoForProject(primaryDataSource, user)
  project.assistant = await configAssistantForProject(project, fileInfos, user, org)

  const setKey = userProjectIdsSetKey(user.id)
  const itemKey = userProjectKey(user.id, projectId)

  await kv.hset(itemKey, project)
  await kv.zadd(setKey, {
    score: +new Date(),
    member: itemKey
  })

  return project
}
