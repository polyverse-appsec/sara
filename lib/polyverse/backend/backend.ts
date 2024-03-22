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
  saas_client?: boolean
  portal_url?: string | null
  github_username?: string
}

export async function getFileInfo(
  projectName: string,
  orgId: string,
  email: string,
): Promise<ProjectDataReference[]> {
  const url = `${USER_SERVICE_URI}/api/user_project/${orgId}/${projectName}/data_references`

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
        `${orgId}/${projectName} for ${email}' - Status: ${res.status} - Error: ${errText}`,
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

      // rename the last updated field to lastUpdatedAt
      if (mappedFileInfo.lastUpdated) {
        delete mappedFileInfo.lastUpdated
        mappedFileInfo.lastUpdatedAt = new Date(fileInfo.lastUpdated * 1000)
      }

      return mappedFileInfo as ProjectDataReference
    }) as ProjectDataReference[]
  } catch (error) {
    console.error(
      'Error making a request or parsing a response for project ID: ',
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
        description
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

/**
 * Helper method that creates a shallow copy of the given object with all properties
 * that evaluate to undefined removed. This does not modify the original object.
 *
 * This is useful to invoke on objects before you hash them in Redis. Failure to do
 * so can result in errors such as:
 * ⨯ UpstashError: ERR unsupported arg type: %!q(<nil>): <nil>
 *
 * @param {object} objectToStrip Object from which undefined properties will be stripped.
 * @returns {Record<string, any>} A new object with undefined properties removed.
 */
export function stripUndefinedObjectProperties(
  objectToStrip: any,
): Record<string, any> {
  // Guard against `null` as it is considered an object in JS
  if (typeof objectToStrip !== 'object' || objectToStrip === null) {
    return objectToStrip
  }

  const strippedObject: Record<string, any> = {}
  Object.keys(objectToStrip).forEach((key) => {
    if (objectToStrip[key] !== undefined) {
      strippedObject[key] = objectToStrip[key]
    } else {
      console.log(`Stripping key '${key}' from object`)
      console.log(
        'BUGBUGBUBUGBUG: WE SHOULD NEVER GET HERE!! SOMETHING IS WRONG',
      )
    }
  })

  return strippedObject
}

//////////////////////////////////////////////////////////////////
// New Backend Calls The Support Updated Data Model
// Updated Data Model Not Complete Yet - Leave Existing Calls
//////////////////////////////////////////////////////////////////

export async function getFileInfoPartDeux(
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
        `getFileInfoPartDeux: Got a failure response while trying to get file IDs for '${billingOrgName}/${projectId} for ${email}' - Status: ${res.status} - Error: ${errText}`,
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

      // Map any snaked_cased data members to camelCased data members.
      //
      // Currently the call to
      // `GET /api/user_project/orgId/projectName/data_references` returns
      // `last_updated` as a Unix timestamp in seconds. Lets convert it to
      // milliseconds.
      //
      // Note we conditionally delete `last_updated` now as we made changes
      // in the Boost Node backend service in commit `80ba0a` to move to
      // camelCase. Now we are just protecting some backwards functionality in
      // the event any day does come snake_cased.
      if (mappedFileInfo.last_updated) {
        delete mappedFileInfo.last_updated
        mappedFileInfo.lastUpdatedAt = new Date(fileInfo.last_updated * 1000)
      } else if (mappedFileInfo.lastUpdated) {
        delete mappedFileInfo.lastUpdated
        mappedFileInfo.lastUpdatedAt = new Date(fileInfo.lastUpdated * 1000)
      }

      return mappedFileInfo as ProjectDataReference
    }) as ProjectDataReference[]
  } catch (error) {
    console.error(
      'getFileInfoPartDeux: Error making a request or parsing a response for project ID: ',
      error,
    )
  }
  return []
}
