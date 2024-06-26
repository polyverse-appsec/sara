import { kv } from '@vercel/kv'

import { type Org } from './../../data-model-types'
import { globalOrgIdsSetKey, orgKey } from './keys'

const createOrg = async (org: Org): Promise<void> => {
  // Create the new org...
  const itemKey = orgKey(org.id)

  await kv.hset(itemKey, org)

  // Track our new org globally...
  const orgIdsSetKey = globalOrgIdsSetKey()
  await kv.zadd(orgIdsSetKey, {
    score: +new Date(),
    member: org.id,
  })
}

export default createOrg
