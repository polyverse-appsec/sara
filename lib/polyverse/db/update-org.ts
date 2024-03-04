import { kv } from '@vercel/kv'

import { type OrgPartDeux } from './../../data-model-types'
import { orgKey } from './keys'

const updateOrg = async (org: OrgPartDeux): Promise<void> => {
  const itemKey = orgKey(org.id)

  org.lastUpdatedAt = new Date()

  await kv.hset(itemKey, org)
}

export default updateOrg
