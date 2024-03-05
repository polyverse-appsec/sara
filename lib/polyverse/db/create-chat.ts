import { kv } from '@vercel/kv'

import { type ChatPartDeux } from './../../data-model-types'
import { globalChatIdsSetKey, chatKey } from './keys'

const createChat = async (chat: ChatPartDeux): Promise<void> => {
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
