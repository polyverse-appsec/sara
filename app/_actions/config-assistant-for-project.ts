'use server'

import isEqual from 'lodash/isEqual'
import orderBy from 'lodash/orderBy'

import { type Assistant } from 'openai/resources/beta/assistants/assistants'

import { auth } from './../../auth'
import {
  type Project,
  type ProjectDataReference,
  type User,
} from './../../lib/data-model-types'
import {
  createAssistantWithFileInfosFromRepo,
  findAssistantForRepo,
  updateAssistantPromptAndFiles
} from './../../lib/polyverse/openai/assistants'

import getCachedProjectUserFileInfos from './get-cached-project-user-file-infos'
import setCachedProjectUserFileInfos from './set-cached-project-user-file-infos'

const fileInfosEqual = (thisFileInfos: ProjectDataReference[], thatFileInfos: ProjectDataReference[]): boolean => {
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
): Promise<Assistant> {
  const session = await auth()

  if (!session?.user?.id || user.id !== session.user.id) {
    throw new Error('Unauthorized')
  }

  // Start by looking for an existing assistant...
  const existingAssistant = await findAssistantForRepo(project.name)

  // If we did find an existing assistant check to see if we need to update the
  // assistant with newer file info...
  if (existingAssistant) {
    const cachedFileInfos = await getCachedProjectUserFileInfos(project.name, user)

    const shouldUpdateAssistantPrompt = !(fileInfosEqual(fileInfos, cachedFileInfos))

    if (shouldUpdateAssistantPrompt) {
      const updatedAssistant = await updateAssistantPromptAndFiles(fileInfos, existingAssistant)
      await setCachedProjectUserFileInfos(project.name, user, fileInfos)

      return updatedAssistant
    }

    return existingAssistant
  }

  // Otherwise just create a new assistant now with the file infos and cache
  // them...
  const createdAssistant = await createAssistantWithFileInfosFromRepo(fileInfos, project.name)
  await setCachedProjectUserFileInfos(project.name, user, fileInfos)

  return createdAssistant
}
