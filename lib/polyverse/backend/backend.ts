import { createSignedHeader, getBodyFromBoostServiceResponse, USER_SERVICE_URI } from './utils'

export interface BoostUserOrgStatusResponse {
  enabled?: boolean
  status?: string // paid, trial
  plan?: string // premium, basic, trial
  plan_name?: string // long display friendly name of plan
  billingUrl?: string | null
  githubUsername?: string
  backgroundAnalysisAuthorized?: boolean
}

export async function rediscoverProject(
  orgId: string,
  projectId: string,
  email: string,
  resetResources = false,
): Promise<void> {
  const url = `${USER_SERVICE_URI}/api/user_project/${orgId}/${projectId}/discovery`

  const rediscoveryRequest = {
    resetResources: true,
  }
  let payloadBody = undefined
  if (resetResources) {
    payloadBody = JSON.stringify(rediscoveryRequest)
  }

  try {
    const signedHeader = createSignedHeader(email)
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...signedHeader,
      },
      body: payloadBody,
    })

    if (!res.ok) {
      console.error(
        `Got a failure response while trying to rediscovery project for '${orgId}/${projectId} for ${email}' - Status: ${res.status}`,
      )

      return
    }
  } catch (error: any) {
    const errMsg = `Error while trying to discover project for '${orgId}/${projectId} for ${email}'`

    console.error(errMsg, error.stack || error)

    throw new Error(errMsg)
  }
}

export async function deleteProject(
  orgId: string,
  projectId: string,
  email: string,
): Promise<void> {
  const url = `${USER_SERVICE_URI}/api/user_project/${orgId}/${projectId}`

  try {
    const signedHeader = createSignedHeader(email)
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...signedHeader,
      },
    })

    if (!res.ok) {
      console.error(
        `Got a failure response while trying to delete project for '${orgId}/${projectId} for ${email}' - Status: ${res.status}`,
      )

      return
    }

    // // TODO: Return this if we actually get something in the response
    // // TODO: Properly type the return of this
    // const deletedProject = await res.json()
  } catch (error) {
    const errMsg = `Error while trying to delete project for '${orgId}/${projectId} for ${email}' - ${error}`

    console.error(errMsg)

    throw new Error(errMsg)
  }
}

export async function getBoostOrgUserStatus(
  orgName: string,
  email: string,
): Promise<BoostUserOrgStatusResponse> {
  const url = `${USER_SERVICE_URI}/api/user/${orgName}/account`

  const signedHeader = createSignedHeader(email)
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...signedHeader,
    },
  })

  if (!res.ok) {
    const errResMsg = await res.text()
    const errLogMsg = `Got a failure response while trying to get status for '${orgName}' - Status: ${res.status} - Message: ${errResMsg}`

    console.error(`${errLogMsg}`)

    throw new Error(errLogMsg)
  }

  return getBodyFromBoostServiceResponse<BoostUserOrgStatusResponse>(res)
}

export async function updateBoostOrgUserStatus(
  orgName: string,
  email: string,
  githubUsername: string,
): Promise<void> {
  const url = `${USER_SERVICE_URI}/api/user/${orgName}/account`

  const usernameInfo = {
    githubUsername,
  } as BoostUserOrgStatusResponse

  const signedHeader = createSignedHeader(email)
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...signedHeader,
    },
    body: JSON.stringify(usernameInfo),
  })

  if (!res.ok) {
    const errResMsg = await res.text()
    const errLogMsg = `Got a failure response while trying to update GitHub username for '${orgName}' - '${email}' - '${githubUsername}' - Status: ${res.status} - Message: ${errResMsg}`

    console.error(`${errLogMsg}`)

    throw new Error(errLogMsg)
  }
}

export async function getBoostOrgStatus(
  orgName: string,
  email: string,
): Promise<BoostUserOrgStatusResponse> {
  const url = `${USER_SERVICE_URI}/api/org/${orgName}/account`

  const signedHeader = createSignedHeader(email)
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...signedHeader,
    },
  })

  if (!res.ok) {
    const errResMsg = await res.text()
    const errLogMsg = `Got a failure response while trying to get status for '${orgName}' - Status: ${res.status} - Message: ${errResMsg}`

    console.error(`${errLogMsg}`)

    throw new Error(errLogMsg)
  }

  return getBodyFromBoostServiceResponse<BoostUserOrgStatusResponse>(res)
}
