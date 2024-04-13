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
            Sara is in an experimental launch phase. Service may be interrupted
            in the future. If you need any assistance or have any questions
            please contact <Link>support@polyverse.com</Link>.
          </Text>
        </Flex>
      </Callout.Text>
    </Callout.Root>
  )
}

export default ExperimentalCallout
