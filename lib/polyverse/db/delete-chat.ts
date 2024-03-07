import { kv } from '@vercel/kv'

import {
  chatKey,
  globalChatIdsSetKey,
  relatedChatQueriesToChatIdsSetKey,
} from './../../../lib/polyverse/db/keys'

import deleteChatQuery from './../../../lib/polyverse/db/delete-chat-query'

const deleteChat = async (chatId: string): Promise<void> => {
  // Since there is a relationship set of IDs for chat queries start by
  // deleting those...
  const chatQueriesToChatIdsSetKey = relatedChatQueriesToChatIdsSetKey(chatId)
  const chatQueryIds = (await kv.zrange(
    chatQueriesToChatIdsSetKey,
    0,
    -1,
  )) as string[]

  const deleteChatQueryPromises = chatQueryIds.map(
    (chatQueryId) => deleteChatQuery(chatQueryId, chatId))

  await Promise.all(deleteChatQueryPromises)

  // Now just delete the relationship set...
  await kv.del(chatQueriesToChatIdsSetKey)

  // Remove the tracked goal from our global set of goal IDs...
  const itemKey = chatKey(chatId)
  const chatIdsSetKey = globalChatIdsSetKey()
  await kv.zrem(chatIdsSetKey, itemKey)

  // Now delete the actual chat...
  await kv.del(itemKey)
}

export default deleteChat
