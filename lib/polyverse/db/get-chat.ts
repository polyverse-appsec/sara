import { kv } from '@vercel/kv'

import { type Chat } from './../../data-model-types'
import { chatKey } from './keys'

const getChat = async (chatId: string): Promise<Chat> => {
  const itemKey = chatKey(chatId)

  const chat = await kv.hgetall<Chat>(itemKey)

  if (!chat) {
    throw new Error(`Chat with an ID of '${chatId}' doesn't exist`)
  }

  return chat
}

export default getChat
