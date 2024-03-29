'use client'

import { Flex } from '@radix-ui/themes'

interface RenderableResourceProps {
  children: React.ReactNode
}

const RenderableResource = ({ children }: RenderableResourceProps) => {
  return (
    <Flex direction="column" flexGrow="1" flexShrink="1" flexBasis="0%" p="5">
      {children}
    </Flex>
  )
}

export default RenderableResource
