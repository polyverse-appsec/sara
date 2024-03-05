import { kv } from '@vercel/kv'

import { type PromptFileInfo } from './../../data-model-types'
import { promptFileInfoKey } from './keys'

const getPromptFileInfo = async (promptFileInfoId: string): Promise<PromptFileInfo> => {
  const itemKey = promptFileInfoKey(promptFileInfoId)

  const promptFileInfo = await kv.hgetall<PromptFileInfo>(itemKey)

  if (!promptFileInfo) {
    throw new Error(`Prompt file info with an ID of '${promptFileInfoId}' doesn't exist`)
  }

  return promptFileInfo
}

export default getPromptFileInfo
