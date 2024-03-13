import { kv } from '@vercel/kv'

import {
  chatQueryKey,
  globalChatQueryIdsSetKey,
  relatedChatQueriesToChatIdsSetKey,
} from './keys'

const deleteChatQuery = async (
  chatQueryId: string,
  chatId: string,
): Promise<void> => {
  const itemKey = chatQueryKey(chatQueryId)

  // Remove the tracked chat query from its chat relationship set of IDs...
  const chatQueriesToChatIdsSetKey = relatedChatQueriesToChatIdsSetKey(chatId)
  await kv.zrem(chatQueriesToChatIdsSetKey, chatQueryId)

  // Remove the tracked chat query from our global set of chat query IDs...
  const chatQueryIdsSetKey = globalChatQueryIdsSetKey()
  await kv.zrem(chatQueryIdsSetKey, chatQueryId)

  // Delete the chat query instance...
  await kv.del(itemKey)
}

export default deleteChatQuery
