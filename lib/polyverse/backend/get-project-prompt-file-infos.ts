import { PromptFileInfo } from '../../data-model-types'
import {
  createSignedHeader,
  getBodyFromBoostServiceResponse,
  USER_SERVICE_URI,
} from './utils'

const getProjectPromptFileInfos = async (
  email: string,
  billingOrgName: string,
  projectId: string,
): Promise<PromptFileInfo[]> => {
  const boostServiceUrl = `${USER_SERVICE_URI}/api/user_project/${billingOrgName}/${projectId}/data_references`

  const signedHeader = createSignedHeader(email)
  const res = await fetch(boostServiceUrl, {
    method: 'GET',
    headers: {
      ...signedHeader,
    },
  })

  if (!res.ok) {
    const errResMsg = await res.text()

    const errLogMsg = `${email} ${billingOrgName} Project:${projectId}: getProjectPromptFileInfos - Got a failure response while trying to get project prompt files for '${billingOrgName}/${projectId}' - Status: ${res.status} - Message: ${errResMsg}`

    console.error(`${errLogMsg}`)

    throw new Error(errLogMsg)
  }

  const fileInfos = await getBodyFromBoostServiceResponse<PromptFileInfo[]>(res)

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

    return mappedFileInfo as PromptFileInfo
  }) as PromptFileInfo[]
}

export default getProjectPromptFileInfos
