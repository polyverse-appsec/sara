'use client'

import { InfoCircledIcon } from '@radix-ui/react-icons'
import { Callout, Flex, Link, Text } from '@radix-ui/themes'
import { preReleaseServiceDisclaimer } from 'lib/disclaimers'

// Positioning and sizing should be done in the <HeaderCallouts> component
const ExperimentalCallout = () => {
  return (
    <Callout.Root color="amber">
      <Callout.Text>
        <Flex as="span" align="center" gap="4">
          <InfoCircledIcon />
          <Text>
            {preReleaseServiceDisclaimer}
          </Text>
        </Flex>
      </Callout.Text>
    </Callout.Root>
  )
}

export default ExperimentalCallout
