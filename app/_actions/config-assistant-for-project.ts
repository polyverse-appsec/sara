'use server'

import isEqual from 'lodash/isEqual'
import orderBy from 'lodash/orderBy'
import { type Assistant } from 'openai/resources/beta/assistants/assistants'

import { auth } from './../../auth'
import {
  Organization,
  OrgPartDeux,
  type ProjectPartDeux,
  type Project,
  type ProjectDataReference,
  type User,
} from './../../lib/data-model-types'
import {
  ASSISTANT_METADATA_CREATOR,
  AssistantMetadata,
  createAssistant,
  findAssistantFromMetadata,
  getVersion,
  updateAssistantPromptAndFiles,
} from './../../lib/polyverse/openai/assistants'
import getCachedProjectUserFileInfos from './get-cached-project-user-file-infos'
import setCachedProjectUserFileInfos from './set-cached-project-user-file-infos'

const fileInfosEqual = (
  thisFileInfos: ProjectDataReference[],
  thatFileInfos: ProjectDataReference[],
): boolean => {
  if (!thisFileInfos && !thatFileInfos) {
    return true
  }

  if ((!thisFileInfos && thatFileInfos) || (thisFileInfos && !thatFileInfos)) {
    return false
  }

  if (thisFileInfos.length !== thatFileInfos.length) {
    return false
  }

  const sortedThisFileInfos = orderBy(thisFileInfos, ['id'])
  const sortedThatFileInfos = orderBy(thatFileInfos, ['id'])

  return isEqual(sortedThisFileInfos, sortedThatFileInfos)
}

export async function configAssistantForProject(
  project: Project,
  fileInfos: ProjectDataReference[],
  user: User,
  org: Organization | OrgPartDeux,
): Promise<Assistant> {
  const session = await auth()

  if (!session?.user?.id || user.id !== session.user.id) {
    throw new Error('Unauthorized')
  }

  // Our codebase is more and more coming to rely on the new data model we have
  // designed and this code path works with the old `Project` type. We make a
  // a mock one here to help support some functions that rely on the new data
  // model types but are still consumed in the old code paths.
  //
  // The validity of the values being assigned are unknown. We are literally
  // just trying our best to get TypeScript to not have any typing errors or
  // usage errors.
  const tempProjectPartDeux: ProjectPartDeux = {
    name: project.name,
    description: project.description,
    orgId: org.login,
    userIds: [],
    projectDataSourceIds: [],
    goalIds: [],
    id: 'some BS ID',
    lastRefreshedAt: new Date(),
    lastUpdatedAt: new Date(),
    createdAt: new Date()
  }

  const existingAssistantMetadata: AssistantMetadata = {
    projectId: project.name,
    userName: user.email!,
    orgName: org.login,
    creator: '', // ignore creator for search
    version: '', // ignore version for search
    stage: process.env.SARA_STAGE || 'unknown',
  }

  // Start by looking for an existing assistant...
  const existingAssistant = await findAssistantFromMetadata(
    existingAssistantMetadata,
  )

  // If we did find an existing assistant check to see if we need to update the
  // assistant with newer file info...
  if (existingAssistant) {
    const cachedFileInfos = await getCachedProjectUserFileInfos(
      project.name,
      user,
    )

    const shouldUpdateAssistantPrompt = !fileInfosEqual(
      fileInfos,
      cachedFileInfos,
    )

    if (shouldUpdateAssistantPrompt) {

      const updatedAssistant = await updateAssistantPromptAndFiles(
        fileInfos,
        existingAssistant,
        tempProjectPartDeux,
        undefined,
      )

      await setCachedProjectUserFileInfos(project.name, user, fileInfos)

      return updatedAssistant
    }

    return existingAssistant
  }

  const newAssistantMetadata: AssistantMetadata = {
    projectId: project.name,
    userName: user.email!,
    orgName: org.login,
    creator: ASSISTANT_METADATA_CREATOR,
    version: getVersion(),
    stage: process.env.SARA_STAGE || 'unknown',
  }

  // Otherwise just create a new assistant now with the file infos and cache
  // them...
  const createdAssistant = await createAssistant(
    fileInfos,
    newAssistantMetadata,
    tempProjectPartDeux
  )

  await setCachedProjectUserFileInfos(project.name, user, fileInfos)

  return createdAssistant
}
