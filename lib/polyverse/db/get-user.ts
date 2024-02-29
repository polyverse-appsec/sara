import { kv } from '@vercel/kv'

import { type UserPartDeux } from './../../data-model-types'
import { userKey } from './keys'

const getUser = async (email: string): Promise<UserPartDeux> => {
  const itemKey = userKey(email)

  const user = await kv.hgetall<UserPartDeux>(itemKey)

  if (!user) {
    const error = new Error(`User with an email of '${email}' doesn't exist`)

    console.log(`getUser error stack track: ${error.stack}`)

    throw error
  }

  return user
}

export default getUser
