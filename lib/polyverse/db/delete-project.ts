import { kv } from '@vercel/kv'

import deletePromptFileInfo from './../../../lib/polyverse/db/delete-prompt-file-info'
import {
  globalProjectIdsSetKey,
  projectKey,
  relatedPromptFileInfosToProjectIdsSetKey,
} from './../../../lib/polyverse/db/keys'

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

  const deletePromptFileInfoPromises = promptFileInfoIds.map(
    (promptFileInfoId) => deletePromptFileInfo(promptFileInfoId, projectId),
  )

  await Promise.all(deletePromptFileInfoPromises)

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
