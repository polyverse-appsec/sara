import { kv } from '@vercel/kv'

import { type PromptFileInfo } from './../../data-model-types'
import {
  globalPromptFileInfoIdsSetKey,
  promptFileInfoKey,
  relatedPromptFileInfosToProjectIdsSetKey,
} from './keys'

const createPromptFileInfo = async (
  promptFileInfo: PromptFileInfo,
): Promise<void> => {
  // Create the new prompt file info...
  const itemKey = promptFileInfoKey(promptFileInfo.id)

  await kv.hset(itemKey, promptFileInfo)

  // Track our new prompt file info globally...
  const promptFileInfoIdsSetKey = globalPromptFileInfoIdsSetKey()
  await kv.zadd(promptFileInfoIdsSetKey, {
    score: +new Date(),
    member: promptFileInfo.id,
  })

  // Track our new prompt file info in relationship to its project...
  const promptFileInfosToProjectsIdsSetKey =
    relatedPromptFileInfosToProjectIdsSetKey(promptFileInfo.parentProjectId)
  await kv.zadd(promptFileInfosToProjectsIdsSetKey, {
    score: +new Date(),
    member: promptFileInfo.id,
  })
}

export default createPromptFileInfo
