'use client'

import {
  ProjectHealthConfigurationState,
  ProjectHealthStatusValue,
  UserOrgStatus,
} from 'lib/data-model-types'

export const renderHealthIcon = (
  readableHealthValue: ProjectHealthStatusValue,
) => {
  if (readableHealthValue === 'UNHEALTHY') {
    return (
      <p title="Unhealthy: Sara is having some trouble learning about your project.">
        🛑
      </p>
    )
  }

  if (readableHealthValue === 'PARTIALLY_HEALTHY') {
    return (
      <p title="Partially Healthy: Sara is still learning about your project, so answers may not be complete.">
        ⚠️
      </p>
    )
  }

  if (readableHealthValue === 'HEALTHY') {
    return (
      <p title="Healthy: Sara has learned about your project code and architecture.">
        ✅
      </p>
    )
  }

  // If we don't know what value it is then render a magnifying glass to signify searching
  return <p>🔎</p>
}

export const renderHumanReadableHealthStatus = (
  readableHealthValue: ProjectHealthStatusValue,
) => {
  if (readableHealthValue === 'UNHEALTHY') {
    return (
      <p>
        Sara is having some trouble learning about your project code and
        architecture. Never fear! She will not give up learning and trying to
        help. Please come back soon when she is ready!
      </p>
    )
  }

  if (readableHealthValue === 'PARTIALLY_HEALTHY') {
    return (
      <p>
        Sara is still learning about your project, so she may not have the best
        answers yet. Feel free to ask questions now, or have a cup of tea and
        wait a few minutes for her best answers 🍵😊
      </p>
    )
  }

  if (readableHealthValue === 'HEALTHY') {
    return (
      <p>
        Sara has learned about your project code and architecture. She is fully
        up to speed and happy to answer all your architectural and code
        questions!
      </p>
    )
  }

  return 'Unknown'
}

export const renderHumanReadableConfigurationState = (
  configurationState: ProjectHealthConfigurationState,
) => {
  switch (configurationState) {
    case 'UNKNOWN':
      // Don't return a scary string
      return 'Sara has encountered a tear in the fabric of space-time'

    case 'VECTOR_DATA_AVAILABLE':
      return 'Your project has been initialized'
    case 'LLM_CREATED':
      return 'Sara is ready to learn about your project'
    case 'VECTOR_DATA_ATTACHED_TO_LLM':
      return 'Sara is learning about your project'
    case 'VECTOR_DATA_UPDATE_AVAILABLE':
      return 'Sara is updating her knowledge about your project'
    case 'CONFIGURED':
      return 'Sara is fully caught up on your project'

    default:
      // Well we said we wouldn't return a scary string when it was actually in
      // the 'UNKNOWN' state. Lets at least return one here presuming we will
      // never hit it but in the event we haven't handled some state show this
      // string so it could be reported to us via a bug by a customer.
      return 'Sara has crossed the streams... not good'
  }
}

export const getOrgUserStatus = async (
  orgId: string,
  userId: string,
): Promise<UserOrgStatus> => {
  const res = await fetch(`/api/orgs/${orgId}/users/${userId}/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const errText = await res.text()
    console.debug(`Failed to get User Status because: ${errText}`)
    throw new Error(`Failed to get user status`)
  }

  const userStatus = (await res.json()) as UserOrgStatus
  return userStatus
}

export const getOrgStatus = async (
  orgId: string,
  userId: string,
): Promise<UserOrgStatus> => {
  const res = await fetch(`/api/orgs/${orgId}/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const errText = await res.text()
    console.debug(`Failed to get org Status because: ${errText}`)

    throw new Error(`Failed to get org status`)
  }

  const orgStatus = await res.json()
  return orgStatus
}
