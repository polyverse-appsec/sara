'use client'

import { InfoCircledIcon } from '@radix-ui/react-icons'
import { Callout, Flex, Link, Text } from '@radix-ui/themes'

// Set the URL_BASE to the appropriate value for the env variable SARA_STAGE or default to local
export const deploymentStage =
  process.env.SARA_STAGE?.toLowerCase() === 'preview'
    ? 'Pre-Production Preview (Non-Customer Facing)'
    : process.env.SARA_STAGE?.toLowerCase() === 'prod'
      ? 'Customer-Facing Production'
      : process.env.SARA_STAGE?.toLowerCase() === 'dev'
        ? 'Internal Engineering Development (Non-Customer Facing)'
        : 'Local System Developer (Non-Customer Facing)'

// Positioning and sizing should be done in the <HeaderCallouts> component
const DeploymentStageCallout = () => {
  return (
    <Callout.Root color="tomato">
      <Callout.Text>
        <Flex as="span" align="center" gap="4">
          <InfoCircledIcon />
          <Text>
            You are currently using Sara in <strong>{deploymentStage}</strong>{' '}
            deployment environment.
          </Text>
        </Flex>
      </Callout.Text>
    </Callout.Root>
  )
}

export default DeploymentStageCallout
