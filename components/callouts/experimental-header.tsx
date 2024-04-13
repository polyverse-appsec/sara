'use client'

import { InfoCircledIcon } from '@radix-ui/react-icons'
import { Callout, Flex, Link, Text } from '@radix-ui/themes'

// Positioning and sizing should be done in the <HeaderCallouts> component
const ExperimentalCallout = () => {
  return (
    <Callout.Root color="amber">
      <Callout.Text>
        <Flex as="span" align="center" gap="4">
          <InfoCircledIcon />
          <Text>
            This is an alpha release of the new Boost with the Sara AI. The
            Boost service may change or be disrupted without notice. During the
            alpha release no refunds can be made. Thank you.
          </Text>
        </Flex>
      </Callout.Text>
    </Callout.Root>
  )
}

export default ExperimentalCallout
