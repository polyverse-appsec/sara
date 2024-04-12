'use client'

import { InfoCircledIcon } from '@radix-ui/react-icons'
import { Button, Callout, Flex, Text } from '@radix-ui/themes'

const FeedbackHeader = () => {
  return (
    <div className="sticky top-0 w-full z-50 h-[64px]">
      <Callout.Root color="green">
        <Callout.Text>
          <Flex as="span" align="center" gap="4">
            <InfoCircledIcon />
            <Text>
              Sara wants to be useful to you. If you have any feedback or have
              identified any bugs please let her know so she can help you!
            </Text>
            <Button variant="surface">Leave Feedback</Button>
          </Flex>
        </Callout.Text>
      </Callout.Root>
    </div>
  )
}

export default FeedbackHeader
