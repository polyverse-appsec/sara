import { kv } from '@vercel/kv'

import {
  globalPromptFileInfoIdsSetKey,
  promptFileInfoKey,
  relatedPromptFileInfosToProjectIdsSetKey,
} from './keys'

const deletePromptFileInfo = async (
  promptFileInfoId: string,
  parentProjectId: string,
): Promise<void> => {
  const itemKey = promptFileInfoKey(promptFileInfoId)

  // Remove the tracked prompt file info its project relationship set of
  // IDs...
  const promptFileInfosToProjectIdsSetKey =
    relatedPromptFileInfosToProjectIdsSetKey(parentProjectId)
  await kv.zrem(promptFileInfosToProjectIdsSetKey, itemKey)

  // Remove the tracked prompt file info our global set of prompt file info
  // IDs...
  const promptFileInfoIdsSetKey = globalPromptFileInfoIdsSetKey()
  await kv.zrem(promptFileInfoIdsSetKey, itemKey)

  // Delete the prompt file info instance...
  await kv.del(itemKey)
}

export default deletePromptFileInfo
