import { UserOrgStatus } from "lib/data-model-types"

export const getOrgUserStatus = async (
    orgId: string,
    userId: string,
  ): Promise<UserOrgStatus> => {
    const res = await fetch(`/api/orgs/${orgId}/users/${userId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  
    if (!res.ok) {
      const errText = await res.text()
      console.debug(`Failed to get User Status because: ${errText}`)
      throw new Error(`Failed to get user status`)
    }
  
    const userStatus = (await res.json()) as UserOrgStatus
    return userStatus
  }

export const getOrgStatus = async (
  orgId: string,
  userId: string,
): Promise<UserOrgStatus> => {
  const res = await fetch(`/api/orgs/${orgId}/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const errText = await res.text()
    console.debug(`Failed to get org Status because: ${errText}`)

    throw new Error(`Failed to get org status`)
  }

  const orgStatus = await res.json()
  return orgStatus
}