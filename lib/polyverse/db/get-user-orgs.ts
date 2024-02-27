import { kv } from '@vercel/kv'

import { type OrgPartDeux, type UserPartDeux } from './../../data-model-types'
import getUser from './get-user'
import { orgKey, userKey } from './keys'

const getUserOrgs = async (userEmail: string): Promise<OrgPartDeux[]> => {
  // Look up the user to get all of the org IDs they are associated with...
  const user = await getUser(userEmail)

  if (!user.orgIds || user.orgIds.length === 0) {
    return []
  }

  const orgPipeline = kv.pipeline()
  user.orgIds.forEach((orgId) => orgPipeline.hgetall(orgKey(orgId)))

  const orgs = (await orgPipeline.exec()) as OrgPartDeux[]

  return orgs
}

export default getUserOrgs
