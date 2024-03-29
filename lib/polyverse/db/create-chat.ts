import { kv } from '@vercel/kv'

import { type Chat } from './../../data-model-types'
import { chatKey, globalChatIdsSetKey } from './keys'

const createChat = async (chat: Chat): Promise<void> => {
  // Create the new chat...
  const itemKey = chatKey(chat.id)

  await kv.hset(itemKey, chat)

  // Track our new chat query globally...
  const chatIdsSetKey = globalChatIdsSetKey()
  await kv.zadd(chatIdsSetKey, {
    score: +new Date(),
    member: chat.id,
  })
}

export default createChat
