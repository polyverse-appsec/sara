import { kv } from '@vercel/kv'

import { emailKey, globalEmailsSetKey } from './keys'

const createEmail = async (email: string): Promise<void> => {
  // Create the new org...
  const itemKey = emailKey(email)

  await kv.hset(itemKey, { email })

  // Track our new org globally...
  const orgIdsSetKey = globalEmailsSetKey()
  await kv.zadd(orgIdsSetKey, {
    score: +new Date(),
    member: email,
  })
}

export default createEmail
