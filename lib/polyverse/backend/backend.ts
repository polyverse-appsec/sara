import { userInfo } from 'os'

import { ProjectFileInfo } from '../../data-model-types'
import { createSignedHeader, USER_SERVICE_URI } from './utils'

export interface BoostUserOrgStatusResponse {
  enabled?: boolean
  // TODO: What could the values of these be?
  status?: string
  // TODO: What could the values of these be?
  plan?: string
  billingUrl?: string | null
  githubUsername?: string
  backgroundAnalysisAuthorized?: boolean
}

export async function getProjectAssistantFileInfo(
  billingOrgName: string,
  projectId: string,
  email: string,
): Promise<ProjectFileInfo[]> {
  const url = `${USER_SERVICE_URI}/api/user_project/${billingOrgName}/${projectId}/data_references`

  try {
    const signedHeader = createSignedHeader(email)
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        ...signedHeader,
      },
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error(
        `getProjectAssistantFileInfo: Got a failure response while trying to get file IDs for '${billingOrgName}/${projectId} for ${email}' - Status: ${res.status} - Error: ${errText}`,
      )

      return []
    }

    const jsonRes = await res.json()

    if (!jsonRes.body) {
      throw new Error(`Response to GET ${url} doesn't have the 'body' property`)
    }

    const fileInfos = JSON.parse(jsonRes.body)

    // Convert the response format from the Boost Node backend to what we expect
    // for consumption in Sara
    return fileInfos.map((fileInfo: any) => {
      const mappedFileInfo = {
        ...fileInfo,
      } as any

      // `GET /api/user_project/orgId/projectName/data_references` returns
      // `lastUpdated` as a Unix timestamp in seconds. Lets convert it to
      // milliseconds.
      if (mappedFileInfo.lastUpdated) {
        delete mappedFileInfo.lastUpdated
        mappedFileInfo.lastUpdatedAt = new Date(fileInfo.lastUpdated * 1000)
      }

      return mappedFileInfo as ProjectFileInfo
    }) as ProjectFileInfo[]
  } catch (error) {
    console.error(
      'getProjectAssistantFileInfo: Error making a request or parsing a response for project ID: ',
      error,
    )
  }
  return []
}

export async function rediscoverProject(
  orgId: string,
  projectId: string,
  email: string,
): Promise<void> {
  const url = `${USER_SERVICE_URI}/api/user_project/${orgId}/${projectId}/discovery`

  const rediscoveryRequest = {
    resetResources: true,
  }

  try {
    const signedHeader = createSignedHeader(email)
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...signedHeader,
      },
      body: JSON.stringify(rediscoveryRequest),
    })

    if (!res.ok) {
      console.error(
        `Got a failure response while trying to start project for '${orgId}/${projectId} for ${email}' - Status: ${res.status}`,
      )

      return
    }
  } catch (error) {
    const errMsg = `Error while trying to discover project for '${orgId}/${projectId} for ${email}' - ${error}`

    console.error(errMsg)

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

  // TODO: Return this if we actually get something in the response
  // TODO: Properly type the return of this
  const jsonRes = await res.json()

  if (!jsonRes.body) {
    throw new Error(`Response to GET ${url} doesn't have the 'body' property`)
  }

  const userStatus = JSON.parse(jsonRes.body) as BoostUserOrgStatusResponse

  return userStatus as BoostUserOrgStatusResponse
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

  // TODO: Return this if we actually get something in the response
  // TODO: Properly type the return of this
  const jsonRes = await res.json()

  if (!jsonRes.body) {
    throw new Error(`Response to GET ${url} doesn't have the 'body' property`)
  }

  const userStatus = JSON.parse(jsonRes.body) as BoostUserOrgStatusResponse

  return userStatus as BoostUserOrgStatusResponse
}
