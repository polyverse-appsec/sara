import { kv } from '@vercel/kv'

import {
  globalProjectIdsSetKey,
  projectKey,
  relatedPromptFileInfosToProjectIdsSetKey,
} from './keys'

const deleteProject = async (projectId: string): Promise<void> => {
  // Since there is a relationship set of IDs for prompt file infos start by
  // deleting those...
  const promptFileInfosToProjectIdsSetKey =
    relatedPromptFileInfosToProjectIdsSetKey(projectId)
  const promptFileInfoIds = (await kv.zrange(
    promptFileInfosToProjectIdsSetKey,
    0,
    -1,
  )) as string[]

  if (promptFileInfoIds.length > 0) {
    const deletePipeline = kv.pipeline()
    promptFileInfoIds.forEach((promptFileInfoId) =>
      deletePipeline.del(promptFileInfoId),
    )
    await deletePipeline.exec()
  }

  // Now just delete the relationship set...
  await kv.del(promptFileInfosToProjectIdsSetKey)

  // Remove the tracked project from our global set of project IDs...
  const itemKey = projectKey(projectId)
  const projectIdsSetKey = globalProjectIdsSetKey()
  await kv.zrem(projectIdsSetKey, itemKey)

  // Delete the project instance...
  await kv.del(itemKey)
}

export default deleteProject
