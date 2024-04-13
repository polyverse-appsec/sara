import {
  createSignedHeader,
  getTextBodyFromBoostServiceResponse,
  USER_SERVICE_URI,
} from './utils'

const getProjectDataBlueprint = async (
  email: string,
  orgName: string,
  projectId: string,
): Promise<string> => {
  const boostServiceUrl = `${USER_SERVICE_URI}/api/user_project/${orgName}/${projectId}/data/blueprint`

  const signedHeader = createSignedHeader(email)
  const res = await fetch(boostServiceUrl, {
    method: 'GET',
    headers: {
      ...signedHeader,
    },
  })

  if (!res.ok) {
    const errResMsg = await res.text()
    const errLogMsg = `Got a failure response while trying to get project blueprint for '${orgName}/${projectId}' - Status: ${res.status} - Message: ${errResMsg}`

    console.error(`${errLogMsg}`)

    throw new Error(errLogMsg)
  }

  return getTextBodyFromBoostServiceResponse(res)
}

export default getProjectDataBlueprint
