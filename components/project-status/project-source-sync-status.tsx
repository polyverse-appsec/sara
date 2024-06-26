'use client'

import { Url } from 'next/dist/shared/lib/router/router'
import { Box, Flex, Inset, Text } from '@radix-ui/themes'
import Link from 'next/link'
import { type ProjectHealth } from 'lib/data-model-types'
import { BoostProjectStatusState } from 'lib/polyverse/backend/types/BoostProjectStatus'
import { formatDateTimeSinceOperationOccurred } from 'lib/utils'

export const renderSourceSyncValue = (
  backgroundProjectStatus: BoostProjectStatusState,
  projectResources: Url[],
) => {
  // eventually, we'll show detailed sync time for all resources - but for now, just use the first one (primary resource)
  let syncTime = `N/A`
  let syncCommitHash = `N/A`
  let commitLink = undefined
  if (backgroundProjectStatus.sourceDataStatus) {
    const firstResource = backgroundProjectStatus.sourceDataStatus[0]

    if (firstResource && firstResource.syncTime) {
      syncTime = formatDateTimeSinceOperationOccurred(new Date(firstResource.syncTime * 1000), true)
    }

    if (firstResource?.syncHash) {
      syncCommitHash = firstResource.syncHash
    }
    if (projectResources && projectResources.length > 0) {
      commitLink = `${projectResources[0].toString()}/commit/${syncCommitHash}`
    }
  }
  return (
    <Flex direction="column">
      <div>
        <Text size="2" weight="bold">
          {'Source Pulled: '}
        </Text>
        <Text size="2" className="text-green-500">
          {syncTime}
        </Text>
      </div>
      <div>
        <Text size="2" weight="bold">
          {'Commit: '}
        </Text>
        {commitLink?(
          <Link href={commitLink} target="_blank" rel="noopener noreferrer">
            <Text size="2" className="text-green-500" onClick={(e) => e.stopPropagation()}>
              GitHub.com: {syncCommitHash}
            </Text>
          </Link>
          ) : (
          <Text size="2" className="text-green-500">
            {syncCommitHash}
          </Text>
        )}
      </div>
    </Flex>
  )
}

export const renderSourceSyncIcon = (
  backgroundProjectStatus: BoostProjectStatusState,
) => {
  // TODO: this is an incorrect icon - we'll change this to the refresh icon or checkbox eventually
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

const renderBriefSourceSyncDetails = (
  health: ProjectHealth | null,
  projectResources: Url[],
) => {
  if (
    !health ||
    !health.backgroundProjectStatus ||
    !health.backgroundProjectStatus.sourceDataStatus
  ) {
    return (
      <Flex gap="3" align="center">
        <Box>
          <Flex gap="1">
            <Text as="div" size="2" weight="bold">
              {'Status: '}
            </Text>
            <Text size="2">Syncing Source</Text>
          </Flex>
        </Box>
      </Flex>
    )
  }

  return (
    <Flex gap="3" align="center">
      {renderSourceSyncIcon(health.backgroundProjectStatus)}
      <Flex direction="column">
        {renderSourceSyncValue(health.backgroundProjectStatus, [])}
      </Flex>
    </Flex>
  )
}

const renderFullSourceSyncDetails = (
  health: ProjectHealth | null,
  projectResources: Url[],
) => {
  return (
    <div className="flex flex-col p-2 bg-background rounded-lg border border-blue">
    <p className="mb-2 font-semibold text-center">Project Source Sync Status</p>
    <Flex
          className="mb-2 font-semibold p-10 bg-background rounded-lg blue-border break-words"
          justify="between"
          gap="1"
        >
          <Inset>
            {health?.backgroundProjectStatus ? (
              renderSourceSyncValue(health.backgroundProjectStatus, projectResources)
            ) : (
              health?(
                <div>
                <p>
                  <p>Source data status not yet available</p>
                  {health.readableValue === 'UNHEALTHY' ? (
                    <p>Source Sync is temporarily unavailable</p>):
                    (
                      <p>Source Sync should be available soon.</p>)
                  }
                </p>
              </div>
              ):(
                <div>
                  <p>
                    <span>Source data status not yet available</span>
                  </p>
                </div>
              )
            )}
          </Inset>
        </Flex>
    </div>
  )
}

interface ProjectSourceSyncStatusProps {
  health: ProjectHealth | null
  projectResources: string[]
}

const ProjectSourceSyncStatus = ({
  health,
  projectResources,
}: ProjectSourceSyncStatusProps) => {
  return (
    <div>
        {renderFullSourceSyncDetails(health, projectResources)}
    </div>
  )
}

export default ProjectSourceSyncStatus
