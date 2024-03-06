import { kv } from '@vercel/kv'

import { type ChatPartDeux } from './../../data-model-types'
import { chatKey } from './keys'

const getChat = async (chatId: string): Promise<ChatPartDeux> => {
  const itemKey = chatKey(chatId)

  const chat = await kv.hgetall<ChatPartDeux>(itemKey)

  if (!chat) {
    throw new Error(`Chat with an ID of '${chatId}' doesn't exist`)
  }

  return chat
}

export default getChat
