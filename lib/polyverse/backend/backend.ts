import { userInfo } from 'os'

import {
  Project,
  ProjectDataReference,
  Repository,
} from '../../data-model-types'
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
): Promise<ProjectDataReference[]> {
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

      return mappedFileInfo as ProjectDataReference
    }) as ProjectDataReference[]
  } catch (error) {
    console.error(
      'getProjectAssistantFileInfo: Error making a request or parsing a response for project ID: ',
      error,
    )
  }
  return []
}

export async function createProject(
  projectId: string,
  orgId: string,
  name: string,
  description: string,
  primaryDataSource: Repository,
  secondaryDataSources: Repository[],
  email: string,
): Promise<string> {
  console.debug(`Invoking backend call createProject`)
  const url = `${USER_SERVICE_URI}/api/user_project/${orgId}/${projectId}`

  try {
    // For now the Boost backend doesn't support specifying primary data sources
    // separately from secondary data sources so just combine them in a list for
    // now.
    const resources = [primaryDataSource, ...secondaryDataSources].map(
      (dataSource) => ({ uri: dataSource.html_url }),
    )

    const signedHeader = createSignedHeader(email)
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...signedHeader,
      },
      body: JSON.stringify({
        resources,
        title: name,
        description,
      }),
    })

    if (!res.ok) {
      console.error(
        `Got a failure response while trying to start project for '${
          primaryDataSource.orgId
        }/${projectId} for ${email}' - Status: ${
          res.status
        } - Error: ${await res.text()}`,
      )
      return ''
    }

    // TODO: Return this if we actually get something in the response
    // TODO: Properly type the return of this
    const jsonRes = await res.json()

    if (!jsonRes.body) {
      throw new Error(`Response to GET ${url} doesn't have the 'body' property`)
    }

    const createdProject = JSON.parse(jsonRes.body)

    return ''
  } catch (error) {
    console.error(
      'Error making a request or parsing a response for project ID: ',
      error,
    )
  }

  return ''
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

export async function getUserProjects(
  orgName: string,
  email: string,
): Promise<Project[]> {
  console.debug(`Backend call getUserProjects`)
  const url = `${USER_SERVICE_URI}/api/user_project/${orgName}/projects`

  console.debug(`Backend call getUserProjects - url: ${url}`)

  const signedHeader = createSignedHeader(email)
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...signedHeader,
    },
  })

  if (!res.ok) {
    const errResMsg = await res.text()
    const errLogMsg = `Got a failure response while trying to get projects for '${orgName}' for '${email}' - Status: ${res.status} - Message: ${errResMsg}`

    console.error(`${errLogMsg}`)

    throw new Error(errLogMsg)
  }

  const resJson = await res.json()

  console.debug(
    `Backend call getUserProjects - resJson: ${JSON.stringify(resJson)}`,
  )

  // Soooooo this is super weird...
  // On non-production the JSON we deserialize is actually a list of projects.
  // On production we are getting a JSON body in the HTTP response body. What we
  // do here is check to see if resJson has a body property which is a
  // serialized JSON string. If so we return that deserialize. Otherwise we
  // return `resJson` as is expecting it to be an array of projects
  if (resJson.body) {
    console.debug(
      `Backend call getUserProjects - parsing and returning resJson.body: ${resJson.body}`,
    )
    return JSON.parse(resJson.body) as Project[]
  }

  console.debug(
    `Backend call getUserProjects - returning resJson already as parsed JSON: ${JSON.stringify(
      resJson,
    )}`,
  )

  return resJson as Project[]
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
