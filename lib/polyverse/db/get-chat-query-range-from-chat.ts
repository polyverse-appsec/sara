import { kv } from '@vercel/kv'

import { type ChatQuery } from '../../data-model-types'
import { chatQueryKey, relatedChatQueriesToChatIdsSetKey } from './keys'

const getChatQueryRangeFromChat = async (
  chatId: string,
  rangeSize: number = 20,
): Promise<ChatQuery[]> => {
  const chatQueriesToChatIdsSetKey = relatedChatQueriesToChatIdsSetKey(chatId)

  const totalChatQueries = await kv.zcard(chatQueriesToChatIdsSetKey)

  // Ensure that our starting index isn't negative if someone requested more
  // entries than actually exist in the set
  const startingIndex = Math.max(totalChatQueries - rangeSize, 0)
  const endingIndex = totalChatQueries - 1

  const chatQueryIds = (await kv.zrange(
    chatQueriesToChatIdsSetKey,
    startingIndex,
    endingIndex,
  )) as string[]

  if (chatQueryIds.length === 0) {
    return []
  }

  const chatQueriesPipeline = kv.pipeline()
  chatQueryIds.forEach((chatQueryId) =>
    chatQueriesPipeline.hgetall(chatQueryKey(chatQueryId)),
  )

  const chatQueries = (await chatQueriesPipeline.exec()) as ChatQuery[]

  return chatQueries
}

export default getChatQueryRangeFromChat
