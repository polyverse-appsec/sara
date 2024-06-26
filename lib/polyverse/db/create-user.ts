import { kv } from '@vercel/kv'

import { type User } from './../../data-model-types'
import { globalUserEmailsSetKey, userKey } from './keys'

const createUser = async (user: User): Promise<void> => {
  // Create the new user...
  const itemKey = userKey(user.email)

  await kv.hset(itemKey, user)

  // Track our new user globally...
  const userEmailsSetKey = globalUserEmailsSetKey()
  await kv.zadd(userEmailsSetKey, {
    score: +new Date(),
    member: user.email,
  })
}

export default createUser
