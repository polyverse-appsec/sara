import { kv } from '@vercel/kv'

import { type Org } from './../../data-model-types'
import { orgKey } from './keys'

const updateOrg = async (org: Org): Promise<void> => {
  const itemKey = orgKey(org.id)

  org.lastUpdatedAt = new Date()

  await kv.hset(itemKey, org)
}

export default updateOrg
