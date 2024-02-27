import { kv } from '@vercel/kv'

import { type UserPartDeux } from './../../data-model-types'
import { userKey } from './keys'

const getUser = async (email: string): Promise<UserPartDeux> => {
    const itemKey = userKey(email)

    const user = await kv.hgetall<UserPartDeux>(itemKey)

    if (!user) {
        throw new Error(`User with an email of '${email}' doesn't exist`)
    }

    return user
}

export default getUser