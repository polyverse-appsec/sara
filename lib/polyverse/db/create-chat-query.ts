import { kv } from '@vercel/kv'

import { type ChatQuery } from './../../data-model-types'
import {
  chatQueryKey,
  globalChatQueryIdsSetKey,
  relatedChatQueriesToChatIdsSetKey,
} from './keys'

const createChatQuery = async (chatQuery: ChatQuery): Promise<void> => {
  // Create the new chat query...
  const itemKey = chatQueryKey(chatQuery.id)

  await kv.hset(itemKey, chatQuery)

  // Track our new chat query globally...
  const chatQueryIdsSetKey = globalChatQueryIdsSetKey()
  await kv.zadd(chatQueryIdsSetKey, {
    score: +new Date(),
    member: chatQuery.id,
  })

  // Track our new chat query in relationship to its chat...
  const chatQueriesToChatIdsSetKey = relatedChatQueriesToChatIdsSetKey(
    chatQuery.chatId,
  )
  await kv.zadd(chatQueriesToChatIdsSetKey, {
    score: +new Date(),
    member: chatQuery.id,
  })
}

export default createChatQuery
