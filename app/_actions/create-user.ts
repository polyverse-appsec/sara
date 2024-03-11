'use server'

import { kv } from '@vercel/kv'

import { auth } from './../../auth'
import { type User } from './../../lib/data-model-types'

export async function createUser(user: User): Promise<User> {
  const session = await auth()

  if (!session?.user?.id || user.id !== session.user.id) {
    throw new Error('Unauthorized')
  }

  //note that most fields of user will be empty except those in the session object

  await kv.hset(`user:${user.id}`, user)

  return user
}
