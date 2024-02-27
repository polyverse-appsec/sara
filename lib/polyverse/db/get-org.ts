import { kv } from '@vercel/kv'

import { type OrgPartDeux } from './../../data-model-types'
import { orgKey } from './keys'

const getOrg = async (orgId: string): Promise<OrgPartDeux> => {
  const itemKey = orgKey(orgId)

  const org = await kv.hgetall<OrgPartDeux>(itemKey)

  if (!org) {
    throw new Error(`Org with an ID of '${orgId}' doesn't exist`)
  }

  return org
}

export default getOrg
