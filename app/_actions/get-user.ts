'use server'

import { kv } from '@vercel/kv'

import { type User } from './../../lib/data-model-types'

export async function getUser(userId: string): Promise<User | null> {
  const user = await kv.hgetall<User>(`user:${userId}`)

  if (!user) {
    return null
  }

  return user
}
