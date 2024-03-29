'use client'

import Image from 'next/image'
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes'
import RenderableResourceContent from 'components/renderable-resource/renderable-resource-content'

import SaraPortrait from './../../public/Sara_Cartoon_Portrait.png'

interface RenderableSaraChatGuideContentProps {
  children: React.ReactNode
}

const RenderableSaraChatGuideContent = ({
  children,
}: RenderableSaraChatGuideContentProps) => {
  return (
    <RenderableResourceContent>
      <Flex direction="column" align="center">
        <Flex>
          <Image
            src={SaraPortrait}
            alt="Sara AI Assistant"
            title="Sara AI Assistant"
            width={200}
            height={200}
          />

          <Flex direction="column" gapY="2">
            <Box width="824px">
              <Heading>Hi, my name is Sara!</Heading>
              <Text>
                I&apos;m a <Text weight="bold">s</Text>mart{' '}
                <Text weight="bold">a</Text>
                rchitectural <Text weight="bold">r</Text>easoning{' '}
                <Text weight="bold">a</Text>ssistant powered by AI. I understand
                your entire software project and can help you build and maintain
                it faster.
              </Text>
              <br />
              {children}
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </RenderableResourceContent>
  )
}

export default RenderableSaraChatGuideContent
