'use client'

import { Flex, Text } from '@radix-ui/themes'
import {
  GitHubOrg,
  Org,
  ProjectHealthConfigurationState,
  ProjectHealthStatusValue,
  UserOrgStatus,
} from 'lib/data-model-types'

export type RenderableProjectHealthStatusValue =
  | ProjectHealthStatusValue
  | 'UNKNOWN'

export type RenderableProjectHealthConfigurationState =
  | ProjectHealthConfigurationState
  | 'UNKNOWN'

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

export const getOrgStatus = async (orgName: string): Promise<UserOrgStatus> => {
  const res = await fetch(`/api/orgs/${orgName}/status`, {
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

export const getGitHubOrgs = async (): Promise<GitHubOrg[]> => {
  const res = await fetch('/api/integrations/github/orgs')

  if (!res.ok) {
    const errText = await res.text()

    throw new Error(
      `Failed to get a success response when fetching GitHub organizations because: ${errText}`,
    )
  }

  return res.json()
}

export const getBillingOrgs = async (): Promise<Org[]> => {
  const res = await fetch('/api/orgs')

  if (!res.ok) {
    const errText = await res.text()

    throw new Error(
      `Failed to get a success response when fetching billing contexts because: ${errText}`,
    )
  }

  return res.json()
}

export const renderReadableHealthValue = (
  readableHealthValue: RenderableProjectHealthStatusValue,
) => {
  switch (readableHealthValue) {
    case 'HEALTHY': {
      return (
        <Flex gap="1">
          <Text size="2" weight="bold">
            {'Status: '}
          </Text>
          <Text size="2" className="text-green-500">
            Healthy
          </Text>
        </Flex>
      )
    }
    case 'PARTIALLY_HEALTHY': {
      return (
        <Flex gap="1">
          <Text size="2" weight="bold">
            {'Status: '}
          </Text>
          <Text size="2" className="text-yellow-500">
            Becoming Healthy
          </Text>
        </Flex>
      )
    }
    case 'UNHEALTHY': {
      return (
        <Flex gap="1">
          <Text size="2" weight="bold">
            {'Status: '}
          </Text>
          <Text size="2" className="text-red-500">
            Unhealthy
          </Text>
        </Flex>
      )
    }
    case 'UNKNOWN': {
      return (
        <Flex gap="1">
          <Text size="2" weight="bold">
            {'Status: '}
          </Text>
          <Text size="2" className="text-blue-500">
            Unknown
          </Text>
        </Flex>
      )
    }
    default: {
      // Return the unknown name
      return (
        <Flex gap="1">
          <Text size="2" weight="bold">
            {'Status: '}
          </Text>
          <Text size="2" className="text-blue-500">
            Healthy
          </Text>
        </Flex>
      )
    }
  }
}

export const renderHealthIcon = (
  readableHealthValue: RenderableProjectHealthStatusValue,
) => {
  switch (readableHealthValue) {
    case 'HEALTHY': {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 fill-green-500"
        >
          <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
            clipRule="evenodd"
          />
        </svg>
      )
    }
    case 'PARTIALLY_HEALTHY': {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 fill-yellow-500"
        >
          <path
            fillRule="evenodd"
            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm3 10.5a.75.75 0 0 0 0-1.5H9a.75.75 0 0 0 0 1.5h6Z"
            clipRule="evenodd"
          />
        </svg>
      )
    }
    case 'UNHEALTHY': {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 fill-red-500"
        >
          <path
            fillRule="evenodd"
            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
            clipRule="evenodd"
          />
        </svg>
      )
    }
    case 'UNKNOWN': {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 fill-blue-500"
        >
          <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 0 1-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 0 1-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 0 1-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584ZM12 18a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
            clipRule="evenodd"
          />
        </svg>
      )
    }
    default: {
      // Return the unknown SVG
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 fill-blue-500"
        >
          <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 0 1-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 0 1-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 0 1-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584ZM12 18a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
            clipRule="evenodd"
          />
        </svg>
      )
    }
  }
}
