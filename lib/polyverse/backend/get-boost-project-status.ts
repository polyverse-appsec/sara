import {
  createSignedHeader,
  getBodyFromBoostServiceResponse,
  USER_SERVICE_URI,
} from './utils'

import { BoostProjectStatusState } from './types/BoostProjectStatus'

const getBoostProjectStatus = async (
  email: string,
  orgName: string,
  projectId: string,
): Promise<BoostProjectStatusState> => {
  const boostServiceUrl = `${USER_SERVICE_URI}/api/user_project/${orgName}/${projectId}/status`

  const signedHeader = createSignedHeader(email)
  const res = await fetch(boostServiceUrl, {
    method: 'GET',
    headers: {
      ...signedHeader,
    },
  })

  if (!res.ok) {
    const errResMsg = await res.text()
    const errLogMsg = `Got a failure response while trying to get project status for '${orgName}/${projectId}' - Status: ${res.status} - Message: ${errResMsg}`

    console.error(`${errLogMsg}`)

    throw new Error(errLogMsg)
  }

  return getBodyFromBoostServiceResponse<BoostProjectStatusState>(res)
}

export default getBoostProjectStatus
