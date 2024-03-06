import { kv } from '@vercel/kv'

import { type ChatQueryPartDeux } from '../../data-model-types'
import { relatedChatQueriesToChatIdsSetKey, chatQueryKey } from './keys'

const getChatQueryRangeFromChat = async (chatId: string, rangeSize: number = 20): Promise<ChatQueryPartDeux[]> => {
  const chatQueriesToChatIdsSetKey = relatedChatQueriesToChatIdsSetKey(chatId)

  const totalChatQueries = await kv.zcard(chatQueriesToChatIdsSetKey)

  // Ensure that our starting index isn't negative if someone requested more
  // entries than actually exist in the set
  const startingIndex = Math.max(totalChatQueries - rangeSize, 0)
  const endingIndex = totalChatQueries - 1

  const chatQueryIds = (await kv.zrange(chatQueriesToChatIdsSetKey, startingIndex, endingIndex)) as string[]

  if (chatQueryIds.length === 0) {
    return []
  }

  const chatQueriesPipeline = kv.pipeline()
  chatQueryIds.forEach((chatQueryId) => chatQueriesPipeline.hgetall(chatQueryKey(chatQueryId)))

  const chatQueries = (await chatQueriesPipeline.exec()) as ChatQueryPartDeux[]

  return chatQueries
}

export default getChatQueryRangeFromChat
