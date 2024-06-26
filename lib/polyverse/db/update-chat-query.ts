import { kv } from '@vercel/kv'

import { type ChatQuery } from './../../data-model-types'
import { chatQueryKey } from './keys'

const updateChatQuery = async (chatQuery: ChatQuery): Promise<void> => {
  const itemKey = chatQueryKey(chatQuery.id)

  // TODO: DRY up this logic across all update functions
  chatQuery.lastUpdatedAt = new Date()

  await kv.hset(itemKey, chatQuery)
}

export default updateChatQuery
