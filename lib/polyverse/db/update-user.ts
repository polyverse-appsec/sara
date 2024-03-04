import { kv } from '@vercel/kv'

import { type UserPartDeux } from './../../data-model-types'
import { userKey } from './keys'

const updateUser = async (user: UserPartDeux): Promise<void> => {
  const itemKey = userKey(user.email)

  user.lastUpdatedAt = new Date()

  await kv.hset(itemKey, user)
}

export default updateUser
