import { kv } from '@vercel/kv'

import { relatedPromptFileInfosToProjectIdsSetKey } from './keys'

const getProjectPromptFileInfoIds = async (
  projectId: string,
): Promise<string[]> => {

  const promptFileInfosToProjectIdsSetKey =
    relatedPromptFileInfosToProjectIdsSetKey(projectId)

  return (await kv.zrange(promptFileInfosToProjectIdsSetKey, 0, -1)) as string[]
}

export default getProjectPromptFileInfoIds
