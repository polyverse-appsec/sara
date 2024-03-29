import { kv } from '@vercel/kv'

import { type Chat } from './../../data-model-types'
import { chatKey } from './keys'

const updateChat = async (chat: Chat): Promise<void> => {
  const itemKey = chatKey(chat.id)

  // TODO: DRY up this logic across all update functions
  chat.lastUpdatedAt = new Date()

  await kv.hset(itemKey, chat)
}

export default updateChat
