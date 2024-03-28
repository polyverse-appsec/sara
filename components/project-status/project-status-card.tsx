'use client'

import { Box, Card, Flex, HoverCard, Inset, Text } from '@radix-ui/themes'
import { renderHealthIcon, renderReadableHealthValue } from 'app/react-utils'
import LoadingSpinner from 'components/loading-spinner'
import { type ProjectHealth } from 'lib/data-model-types'

import ProjectStatusDetailsHoverCard from './project-status-details-card'

const renderBriefHealthDetails = (health: ProjectHealth | null) => {
  if (!health) {
    return (
      <Flex gap="3" align="center">
        <LoadingSpinner />
        <Box>
          <Flex gap="1">
            <Text as="div" size="2" weight="bold">
              {'Status: '}
            </Text>
            <Text size="2">Loading</Text>
          </Flex>
        </Box>
      </Flex>
    )
  }

  return (
    <Flex gap="3" align="center">
      {renderHealthIcon(health.readableValue)}
      <Flex direction="column">
        {renderReadableHealthValue(health.readableValue)}
      </Flex>
    </Flex>
  )
}

const renderProjectStatusDetails = (
  health: ProjectHealth | null,
  lastRefreshedAt: Date,
) => {
  if (!health) {
    return <LoadingSpinner />
  }

  return (
    <Inset>
      {health ? (
        <ProjectStatusDetailsHoverCard
          health={health}
          lastRefreshedAt={lastRefreshedAt}
        />
      ) : null}
    </Inset>
  )
}

interface ProjectStatusCardProps {
  health: ProjectHealth | null
  lastRefreshedAt: Date
}

const ProjectStatusCard = ({
  health,
  lastRefreshedAt,
}: ProjectStatusCardProps) => {
  return (
    <HoverCard.Root>
      <HoverCard.Trigger>
        <Card>{renderBriefHealthDetails(health)}</Card>
      </HoverCard.Trigger>
      <HoverCard.Content>
        {renderProjectStatusDetails(health, lastRefreshedAt)}
      </HoverCard.Content>
    </HoverCard.Root>
  )
}

export default ProjectStatusCard
