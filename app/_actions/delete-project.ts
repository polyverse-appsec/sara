'use server'

import { kv } from '@vercel/kv'
import { userProjectIdsSetKey, userProjectKey } from 'lib/polyverse/db/keys'

import { auth } from './../../auth'
import { type User } from './../../lib/data-model-types'
import { deleteProject as deleteProjectBackend } from './../../lib/polyverse/backend/backend'
import getCachedProjectUserFileInfos from './get-cached-project-user-file-infos'
import { deleteCachedProjectUserFileInfos } from './delete-cached-project-user-file-infos'
import { type AssistantMetadata, findAssistantFromMetadata, deleteAssistantFiles, deleteAssistant } from './../../lib/polyverse/openai/assistants'

async function deleteProjectVercel(
  userId: string,
  projectId: string,
): Promise<void> {
  // Generate the keys needed to locate the project in the k/v store
  const setKey = userProjectIdsSetKey(userId)
  const itemKey = userProjectKey(userId, projectId)

  // Remove the project data from the k/v store
  await kv.del(itemKey)

  // Remove the project ID from the user's set of project IDs
  await kv.zrem(setKey, itemKey)
  console.log(`Deleted project ${projectId} for user ${userId}`)
}

export const deleteProject = async (
  orgId: string,
  user: User,
  projectName: string,
  projectId: string,
) => {
  const session = await auth()

  if (!session?.user?.id || user?.id !== session.user.id || !user.email) {
    throw new Error('Unauthorized')
  }

  // First clean up ancillary resources...
  const cachedFileInfos = await getCachedProjectUserFileInfos(projectName, user)
  await deleteCachedProjectUserFileInfos(user, projectName, cachedFileInfos)

  // Secondaly delete any OpenAI resources...
  const existingAssistantMetadata: AssistantMetadata = {
    projectId: projectName,
    userName: user.email!,
    org: orgId,
    creator: '', // ignore creator for search
    version: '', // ignore version for search
  }

  const existingAssistant = await findAssistantFromMetadata(existingAssistantMetadata)

  if (existingAssistant) {
    await deleteAssistantFiles(existingAssistant)
    await deleteAssistant(existingAssistant.id)
  }

  await deleteProjectBackend(orgId, projectName, user.email)
  await deleteProjectVercel(user.id, projectId)
}
