import {
  createSignedHeader,
  getBodyFromBoostServiceResponse,
  USER_SERVICE_URI,
} from './utils'

// Copied from the Boost Node service codebase
export enum BoostProjectStatuses {
  Unknown = 'Unknown', // project not found
  OutOfDateProjectData = 'Out of Date Project Data', // project data out of date with source (e.g. newer source)
  ResourcesMissing = 'Resources Missing', // project uris found, but not resources
  // ResourcesOutOfDate = 'Resources Out of Date',        // Resources out of date with source (e.g. newer source)
  ResourcesIncomplete = 'Resources Incomplete', // resources found, but not completely generated
  ResourcesInError = 'Resources In Error', // resources found, but generators in error state
  ResourcesGenerating = 'Resources Generating', // resources missing or incomplete, but still being generated
  ResourcesNotSynchronized = 'Resources Not Synchronized', // resources completely generated, but not synchronized to OpenAI
  AIResourcesOutOfDate = 'AI Data Out of Date', // resources synchronized to OpenAI, but newer resources available
  Synchronized = 'Fully Synchronized', // All current resources completely synchronized to OpenAI
}

// Copied from the Boost Node service codebase
export interface BoostProjectStatus {
  status: BoostProjectStatuses
  synchronized: boolean
  activelyUpdating: boolean
  resourcesState: any[]
  details: string
  lastSynchronized: Date
  lastUpdated: Date
}

const getBoostProjectStatus = async (
  email: string,
  orgName: string,
  projectName: string,
): Promise<BoostProjectStatus> => {
  const boostServiceUrl = `${USER_SERVICE_URI}/api/user_project/${orgName}/${projectName}/status`

  const signedHeader = createSignedHeader(email)
  const res = await fetch(boostServiceUrl, {
    method: 'GET',
    headers: {
      ...signedHeader,
    },
  })

  if (!res.ok) {
    const errResMsg = await res.text()
    const errLogMsg = `Got a failure response while trying to get project status for '${orgName}/${projectName}' - Status: ${res.status} - Message: ${errResMsg}`

    console.error(`${errLogMsg}`)

    throw new Error(errLogMsg)
  }

  return getBodyFromBoostServiceResponse<BoostProjectStatus>(res)
}

export default getBoostProjectStatus
