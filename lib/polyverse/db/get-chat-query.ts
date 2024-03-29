import { kv } from '@vercel/kv'

import { type ChatQuery } from './../../data-model-types'
import { chatQueryKey } from './keys'

const getChatQuery = async (
  chatQueryId: string,
): Promise<ChatQuery> => {
  const itemKey = chatQueryKey(chatQueryId)

  const chatQuery = await kv.hgetall<ChatQuery>(itemKey)

  if (!chatQuery) {
    throw new Error(`Chat query with an ID of '${chatQueryId}' doesn't exist`)
  }

  return chatQuery
}

export default getChatQuery
