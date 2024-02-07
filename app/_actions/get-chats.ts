'use server'

import { kv } from '@vercel/kv'

import { type Chat } from './../../lib/data-model-types'

const TEN_MINS_IN_MILLIS = 600000

export async function getChats(taskId?: string | null) {
  if (!taskId) {
    return []
  }

  try {
    const pipeline = kv.pipeline()

    //if we have a taskId, get the chats associated with that task, otherwise get the chats associated with the user
    const taskChatsKey = `task:chats:${taskId}`
    const dateScoreInMillis = Date.now() + TEN_MINS_IN_MILLIS

    // The original implementation of this based on
    // https://github.com/vercel/ai-chatbot had a call of `zrange` with the
    // `rev` option set to true and the indexes of (0, -1). For some reason
    // this wouldn't return results for us. I believe that it may have to be
    // with the score we assign which is millis since epoch. Something to look
    // into in the future.
    //
    // Either way we don't reverse anymore and we query for all elements of the
    // `task:chats:{taskId}` and we do a reverse of the results ourselves. This
    // ought to return similar results as if we used the `rev` option with the
    // indexes of (0, -1) since it is unlikely there will be collisions of the
    // scores since we are in milliseconds.
    //
    // Note this depends on NTP being correctly configured on the host as well.
    let chats: string[] = await kv.zrange(taskChatsKey, 0, dateScoreInMillis)

    if (!chats.length) {
      return []
    }

    chats.reverse()

    for (const chat of chats) {
      pipeline.hgetall(chat)
    }

    const results = await pipeline.exec()

    return results as Chat[]
  } catch (error) {
    console.error('Error getting chats: ', error)
    return []
  }
}
