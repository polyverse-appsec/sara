'use server'

import { Assistant } from 'openai/resources/beta/assistants/assistants'

import { auth } from './../../auth'
import {
  OrgPartDeux,
  type Organization,
  type Project,
  type Repository,
  type User,
} from './../../lib/data-model-types'
import { configAssistantForProject } from './config-assistant-for-project'
import { createProjectOnBoost } from './create-project-on-boost'
import { createProjectOnSara } from './create-project-on-sara'
import { getFileInfoForProject } from './get-file-info-for-repo'

// TODO: Remove the Organization type once we crossover to OrgPartDeux fully in the signature
export const createProject = async (
  org: Organization | OrgPartDeux,
  projectName: string,
  primaryDataSource: Repository,
  secondaryDataSources: Repository[],
): Promise<[Project, Assistant]> => {
  const session = await auth()

  if (!session?.user?.id || !session?.user?.email) {
    throw new Error('Unauthorized')
  }

  // First start by creating the project on the Boost service...
  // TODO: Get the returned value here
  await createProjectOnBoost(
    projectName,
    primaryDataSource,
    secondaryDataSources,
  )

  // Then create the project on the Sara service...
  const project = await createProjectOnSara(
    projectName,
    primaryDataSource,
    secondaryDataSources,
  )

  // Prepare for OpenAI Assistant creation by gathering file information. Note
  // this call needs to happen after we create the project on the Boost backend
  // in order to get file IDs back.
  //
  // Getting file IDs back isn't an indication that the files have been fully
  // processed yet.
  const fileInfos = await getFileInfoForProject(
    projectName,
    primaryDataSource,
    session.user,
  )

  // Configure the OpenAI Assistant...
  const assistant = await configAssistantForProject(
    project,
    fileInfos,
    session.user,
    org,
  )

  return [project, assistant]
}
