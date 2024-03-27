import { userInfo } from 'os'

import {
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

export const enum ResourceType {
    PrimaryRead = "primary_read",       // user read-only to source
    PrimaryReadWrite = "primary_write",     // user read/write to source
    ReferenceRead = "reference_read",   // user read-only to reference
}

export const enum ResourceStatus {
    Public = "public",
    Private = "private",
    Unknown = "unknown",
    Error = "error",
}

export interface ProjectResource {
    uri: string;
    type: string;
    access: ResourceStatus;
}
export interface UserProjectData {
    org? : string,
    name? : string,
    owner? : string,
    description? : string,
    title?: string,
    // guidelines are a keyed list of guidelines for the project
    guidelines? : Record<string, string>[],
    resources : ProjectResource[],
    lastUpdated? : number,
}

export async function createProject(
  projectId: string,
  orgId: string,
  name: string,
  description: string,
  primaryDataSource: Repository,
  secondaryDataSources: Repository[],
  projectGuidelines: string[],
  email: string,
): Promise<string> {
  console.debug(`Invoking backend call createProject`)
  const url = `${USER_SERVICE_URI}/api/user_project/${orgId}/${projectId}`

  try {
    const resources = [primaryDataSource, ...secondaryDataSources].map(
      (dataSource) => ({
        uri: dataSource.html_url,
        type: ResourceType.PrimaryReadWrite,
     } as ProjectResource),
    )

    // create ordered array of guidelines, with each guideline having a key
    //    that is its numeric order in list
    const guidelines = projectGuidelines.map((guideline, index) => {
        return { [(index + 1).toString()]: guideline }
        })

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
        guidelines: guidelines,
      } as UserProjectData),
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

export async function projectDiscover(
    orgId: string,
    projectId: string,
    email: string,
)

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
