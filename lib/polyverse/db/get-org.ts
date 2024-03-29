import { kv } from '@vercel/kv'

import { type Org } from './../../data-model-types'
import { orgKey } from './keys'

const getOrg = async (orgId: string): Promise<Org> => {
  const itemKey = orgKey(orgId)

  const org = await kv.hgetall<Org>(itemKey)

  if (!org) {
    throw new Error(`Org with an ID of '${orgId}' doesn't exist`)
  }

  return org
}

export default getOrg
