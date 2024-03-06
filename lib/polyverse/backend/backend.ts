// TODO: 'use server' this and replace actions with it?
import { data } from 'components/ui/treeview-data-test'
import jsonwebtoken from 'jsonwebtoken'

import {
  Project,
  ProjectDataReference,
  Repository,
} from '../../data-model-types'

const { sign } = jsonwebtoken

// AWS Endpoints for our Boost ReST API (Backend)
// Legacy:  'https://pt5sl5vwfjn6lsr2k6szuvfhnq0vaxhl.lambda-url.us-west-2.on.aws/api/user_project'

// Local: 'http://localhost:8000'
const URL_SERVICE_URI_DEV =
  'https://3c27qu2ddje63mw2dmuqp6oa7u0ergex.lambda-url.us-west-2.on.aws' // SARA_STAGE=dev
const URL_SERVICE_URI_PREVIEW =
  'https://sztg3725fqtcptfts5vrvcozoe0nxcew.lambda-url.us-west-2.on.aws' // SARA_STAGE=test
const URL_SERVICE_URI_PROD =
  'https://33pdosoitl22c42c7sf46tabi40qwlae.lambda-url.us-west-2.on.aws' // SARA_STAGE=prod

// set the URL_BASE to the appropriate value for the env variable SARA_STAGE or default to dev
const USER_SERVICE_URI =
  process.env.SARA_STAGE?.toLowerCase() === 'preview'
    ? URL_SERVICE_URI_PREVIEW
    : process.env.SARA_STAGE?.toLowerCase() === 'prod'
      ? URL_SERVICE_URI_PROD
      : URL_SERVICE_URI_DEV

interface SignedHeader {
  'x-signed-identity': string
}

function createSignedHeader(email: string): SignedHeader {
  const privateSaraClientKey = process.env.SARA_CLIENT_PRIVATE_KEY
  const signedIdentityHeader = sign(
    { email },
    privateSaraClientKey as jsonwebtoken.Secret,
    {
      algorithm: 'RS256',
    },
  )
  const header: SignedHeader = {
    'x-signed-identity': signedIdentityHeader,
  }
  return header
}

export async function getFileInfo(
  projectName: string,
  primaryDataSource: Repository,
  email: string,
): Promise<ProjectDataReference[]> {
  const url = `${USER_SERVICE_URI}/api/user_project/${primaryDataSource.orgId}/${projectName}/data_references`

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
        `${primaryDataSource.orgId}/${primaryDataSource.name} for ${email}' - Status: ${res.status} - Error: ${errText}`,
      )

      return []
    }

    const fileInfos = await res.json()

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
      'Error making a request or parsing a response for project ID: ',
      error,
    )
  }
  return []
}

export async function postFileInfoToGetFileInfo(
  projectName: string,
  primaryDataSource: Repository,
  email: string,
): Promise<ProjectDataReference[]> {
  const url = `${USER_SERVICE_URI}/api/user_project/${primaryDataSource.orgId}/${projectName}/data_references`

  try {
    const signedHeader = createSignedHeader(email)
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...signedHeader,
      },
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error(
        `${primaryDataSource.orgId}/${primaryDataSource.name} for ${email}' - Status: ${res.status} - Error: ${errText}`,
      )

      return []
    }

    const fileInfos = await res.json()

    // Convert the response format from the Boost Node backend to what we expect
    // for consumption in Sara
    return fileInfos.map((fileInfo: any) => {
      const mappedFileInfo = {
        ...fileInfo,
      } as any

      // Map any snaked_cased data members to camelCased data members.
      //
      // Currently the call to
      // `POST /api/user_project/orgId/projectName/data_references` returns
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
      'Error making a request or parsing a response for project ID: ',
      error,
    )
  }
  return []
}

export async function createProject(
  projectName: string,
  orgId: string,
  primaryDataSource: Repository,
  secondaryDataSources: Repository[],
  email: string,
): Promise<string> {
  console.debug(`Invoking backend call createProject`)
  const url = `${USER_SERVICE_URI}/api/user_project/${orgId}/${projectName}`

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
      body: JSON.stringify({ resources }),
    })

    if (!res.ok) {
      console.error(
        `Got a failure response while trying to start project for '${
          primaryDataSource.orgId
        }/${projectName} for ${email}' - Status: ${
          res.status
        } - Error: ${await res.text()}`,
      )
      return ''
    }

    // TODO: Return this if we actually get something in the response
    // TODO: Properly type the return of this
    const createdProject = await res.json()

    return ''
  } catch (error) {
    console.error(
      'Error making a request or parsing a response for project ID: ',
      error,
    )
  }

  return ''
}

export async function getProject(repo: Repository, email: string) {
  const url = `${USER_SERVICE_URI}/api/user_project/${repo.orgId}/${repo.name}`

  try {
    const signedHeader = createSignedHeader(email)
    const res = await fetch(url, {
      headers: {
        ...signedHeader,
      },
    })

    if (res.status !== 200) {
      console.debug(`Failed to get a success response when trying to retrieve `)
    }
  } catch (err) {}
}

export async function deleteProject(
  orgId: string,
  projectName: string,
  email: string,
): Promise<void> {
  const url = `${USER_SERVICE_URI}/api/user_project/${orgId}/${projectName}`

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
        `Got a failure response while trying to delete project for '${orgId}/${projectName} for ${email}' - Status: ${res.status}`,
      )

      return
    }

    // // TODO: Return this if we actually get something in the response
    // // TODO: Properly type the return of this
    // const deletedProject = await res.json()
  } catch (error) {
    const errMsg = `Error while trying to delete project for '${orgId}/${projectName} for ${email}' - ${error}`

    console.error(errMsg)

    throw new Error(errMsg)
  }
}

export async function getUserProjects(
  orgId: string,
  email: string,
): Promise<Project[]> {
  console.debug(`Backend call getUserProjects`)
  const url = `${USER_SERVICE_URI}/api/user_project/${orgId}/projects`

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
    const errLogMsg = `Got a failure response while trying to get projects for '${orgId}' for '${email}' - Status: ${res.status} - Message: ${errResMsg}`

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
        `Got a failure response while trying to get file IDs for '${billingOrgName}/${projectId} for ${email}' - Status: ${res.status} - Error: ${errText}`,
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
      'Error making a request or parsing a response for project ID: ',
      error,
    )
  }
  return []
}
