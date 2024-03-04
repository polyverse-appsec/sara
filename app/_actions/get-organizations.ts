'use server'

import { auth } from './../../auth'
import { type Organization } from './../../lib/data-model-types'
import { fetchUserOrganizations } from './../../lib/polyverse/github/repos'

export async function getOrganizations(): Promise<Organization[]> {
  const session = await auth()
  console.debug(`Invoking server action: getOrganizations`)

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const orgs = await fetchUserOrganizations({
    accessToken: session.accessToken,
  })
  return orgs
}
