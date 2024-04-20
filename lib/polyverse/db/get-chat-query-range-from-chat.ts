import { kv } from '@vercel/kv'

import { type ChatQuery } from '../../data-model-types'
import { chatQueryKey, relatedChatQueriesToChatIdsSetKey } from './keys'

export const GetMaxQueryEntries = -1

const getChatQueryRangeFromChat = async (
  chatId: string,
  rangeSize: number = 100,
): Promise<ChatQuery[]> => {
  const chatQueriesToChatIdsSetKey = relatedChatQueriesToChatIdsSetKey(chatId)
  const totalChatQueries = await kv.zcard(chatQueriesToChatIdsSetKey)

  // Handle the special case where rangeSize is -1, to fetch all entries
  let startingIndex = 0
  let endingIndex = totalChatQueries - 1

  // If rangeSize is not GetMaxQueryEntries, adjust indices to get only a range of items
  if (rangeSize !== GetMaxQueryEntries) {
    startingIndex = Math.max(totalChatQueries - rangeSize, 0)
  }

  const chatQueryIds = await kv.zrange(
    chatQueriesToChatIdsSetKey,
    startingIndex,
    endingIndex
  ) as string[]

  if (chatQueryIds.length === 0) {
    return []
  }

  const chatQueriesPipeline = kv.pipeline()
  chatQueryIds.forEach((chatQueryId) =>
    chatQueriesPipeline.hgetall(chatQueryKey(chatQueryId)),
  )

  const chatQueries = await chatQueriesPipeline.exec() as ChatQuery[]

  return chatQueries
}

export default getChatQueryRangeFromChat
