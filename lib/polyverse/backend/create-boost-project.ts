import { type ProjectDataSource } from './../../data-model-types'
import {
  createSignedHeader,
  getBodyFromBoostServiceResponse,
  USER_SERVICE_URI,
} from './utils'

export const enum ResourceType {
  PrimaryRead = 'primary_read', // user read-only to source
  PrimaryReadWrite = 'primary_write', // user read/write to source
  ReferenceRead = 'reference_read', // user read-only to reference
}

export const enum ResourceStatus {
  Public = 'public',
  Private = 'private',
  Unknown = 'unknown',
  Error = 'error',
}

export interface BoostProjectResource {
  uri: string
  type: string
  access: ResourceStatus
}

export interface UserProjectRequestBody {
  org?: string
  name?: string
  owner?: string
  description?: string
  title?: string
  // guidelines are a keyed list of guidelines for the project
  guidelines?: Record<string, string>[]
  resources: BoostProjectResource[]
  lastUpdated?: number
}

const createBoostProject = async (
  projectId: string,
  orgName: string,
  name: string,
  description: string,
  primaryDataSource: ProjectDataSource,
  secondaryDataSources: ProjectDataSource[],
  projectGuidelines: string[],
  email: string,
): Promise<void> => {
  const url = `${USER_SERVICE_URI}/api/user_project/${orgName}/${projectId}`

  const resources = [primaryDataSource, ...secondaryDataSources].map(
    (dataSource) =>
      ({
        uri: dataSource.uri,
        type: ResourceType.PrimaryReadWrite,
      }) as BoostProjectResource,
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
    } as UserProjectRequestBody),
  })

  if (!res.ok) {
    const resErrText = await res.text()
    const errMsg = `Got a failure response while trying to start project for '${orgName}/${projectId} for ${email}' - Status: ${res.status} - Error: ${resErrText}`

    console.error(errMsg)

    throw new Error(errMsg)
  }
}

export default createBoostProject
