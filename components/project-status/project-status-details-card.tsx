'use client'

import { Box, Card, Flex, Text } from '@radix-ui/themes'
import {
  renderHealthIcon,
  renderReadableHealthValue,
  type RenderableProjectHealthConfigurationState,
  type RenderableProjectHealthStatusValue,
} from 'app/react-utils'

import { type ProjectHealth } from '../../lib/data-model-types'

const renderDetailedHealthMessage = (
  readableHealthValue: RenderableProjectHealthStatusValue,
) => {
  switch (readableHealthValue) {
    case 'HEALTHY': {
      return (
        <div className="max-w-64">
          <Text size="2">
            Sara has learned about your project code and architecture. She is
            fully up to speed and happy to answer all your architectural and
            code questions!
          </Text>
        </div>
      )
    }
    case 'PARTIALLY_HEALTHY': {
      return (
        <div className="max-w-64">
          <Text size="2">
            Sara is still learning about your project, so she may not have the
            best answers yet. Feel free to ask questions now, or have a cup of
            tea and wait a few minutes for her best answers.
          </Text>
        </div>
      )
    }
    case 'UNHEALTHY': {
      return (
        <div className="max-w-64">
          <Text size="2">
            Sara is having some trouble learning about your project code and
            architecture. Never fear! She will not give up learning and trying
            to help. Please come back soon when she is ready!
          </Text>
        </div>
      )
    }
    case 'UNKNOWN': {
      return (
        <div className="max-w-64">
          <Text size="2">
            We are contacting Sara right now to see how she is doing and what
            work she has done on your project. Hold tight for updates.
          </Text>
        </div>
      )
    }
    default: {
      // Return the unknown details
      return (
        <div className="max-w-64">
          <Text size="2">
            We are contacting Sara right now to see how she is doing and what
            work she has done on your project. Hold tight for updates.
          </Text>
        </div>
      )
    }
  }
}

export const renderHumanReadableConfigurationState = (
  configurationState: RenderableProjectHealthConfigurationState,
) => {
  switch (configurationState) {
    case 'VECTOR_DATA_AVAILABLE':
      return (
        <Flex gap="3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
          <div>
            <Text size="2" weight="bold">
              {'State: '}
            </Text>
            <Text size="2">Project Initialized</Text>
          </div>
        </Flex>
      )
    case 'LLM_CREATED':
      return (
        <Flex gap="3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
          <div>
            <Text size="2" weight="bold">
              {'State: '}
            </Text>
            <Text size="2">Ready To Learn Your Project</Text>
          </div>
        </Flex>
      )
    case 'VECTOR_DATA_ATTACHED_TO_LLM':
      return (
        <Flex gap="3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          <div>
            <Text size="2" weight="bold">
              {'State: '}
            </Text>
            <Text size="2">Learning Your Project</Text>
          </div>
        </Flex>
      )
    case 'VECTOR_DATA_UPDATE_AVAILABLE':
      return (
        <Flex gap="3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          <div>
            <Text size="2" weight="bold">
              {'State: '}
            </Text>
            <Text size="2">Updating Project Knowledge</Text>
          </div>
        </Flex>
      )
    case 'CONFIGURED':
      return (
        <Flex gap="3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
            />
          </svg>
          <div>
            <Text size="2" weight="bold">
              {'State: '}
            </Text>
            <Text size="2">Project Expertise Obtained</Text>
          </div>
        </Flex>
      )
    case 'UNKNOWN':
      return (
        <Flex gap="3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
            />
          </svg>
          <div>
            <Text size="2" weight="bold">
              {'State: '}
            </Text>
            <Text size="2">Investigating Tear In Space-Time Fabric</Text>
          </div>
        </Flex>
      )
    default:
      return (
        <Flex gap="3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
            />
          </svg>
          <div>
            <Text size="2" weight="bold">
              {'State: '}
            </Text>
            <Text size="2">Investigating Tear In Space-Time Fabric</Text>
          </div>
        </Flex>
      )
  }
}

const renderLastRefreshedAt = (lastRefreshedAt: Date | null) => {
  if (!lastRefreshedAt) {
    return (
      <Flex gap="3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <div>
          <Text size="2" weight="bold">
            {'Last Synced: '}
          </Text>
          <Text size="2" className="text-blue-500">
            Unknown
          </Text>
        </div>
      </Flex>
    )
  }

  return (
    <Flex gap="3">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
      <div>
        <Text size="2" weight="bold">
          {'Last Synced: '}
        </Text>
        <Text size="2">
          {`${new Date(lastRefreshedAt).toLocaleDateString()} ${new Date(
            lastRefreshedAt,
          ).toLocaleTimeString()}`}
        </Text>
      </div>
    </Flex>
  )
}

interface ProjectStatusDetailsCardProps {
  health: ProjectHealth
  lastRefreshedAt: Date | null
}

const ProjectStatusDetailsCard = ({
  health,
  lastRefreshedAt,
}: ProjectStatusDetailsCardProps) => {
  return (
    <Card>
      <Flex gap="3" direction="column">
        <Flex gap="3">
          {renderHealthIcon(health.readableValue)}
          {renderReadableHealthValue(health.readableValue)}
        </Flex>
        {renderHumanReadableConfigurationState(health.configurationState)}
        {renderLastRefreshedAt(lastRefreshedAt)}
        <Box>{renderDetailedHealthMessage(health.readableValue)}</Box>
      </Flex>
    </Card>
  )
}

export default ProjectStatusDetailsCard
