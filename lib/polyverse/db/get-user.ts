import { kv } from '@vercel/kv'

import { type UserPartDeux } from './../../data-model-types'
import { userKey } from './keys'

export const createUserNotFoundErrorString = (email: string) =>
  `User with an email of '${email}' doesn't exist`

const getUser = async (email: string): Promise<UserPartDeux> => {
  const itemKey = userKey(email)

  const user = await kv.hgetall<UserPartDeux>(itemKey)

  if (!user) {
    throw new Error(createUserNotFoundErrorString(email))
  }

  return user
}

export default getUser
