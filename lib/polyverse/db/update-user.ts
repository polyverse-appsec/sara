import { kv } from '@vercel/kv'

import { type User } from './../../data-model-types'
import { userKey } from './keys'

const updateUser = async (user: User): Promise<void> => {
  const itemKey = userKey(user.email)

  user.lastUpdatedAt = new Date()

  await kv.hset(itemKey, user)
}

export default updateUser
