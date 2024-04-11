'use client'

import Image from 'next/image'
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes'
import RenderableResourceContent from 'components/renderable-resource/renderable-resource-content'

import SaraLoadingImg from './../public/Sara-Loading.png'

const SaraLoading = () => {
  return (
    <Flex align="center" justify="center" minHeight="100vh">
      <RenderableResourceContent>
        <Flex direction="column" align="center">
          <Flex>
            <Image
              src={SaraLoadingImg}
              alt="Sara Loading"
              title="Sara Loading"
              width={200}
              height={200}
            />

            <Flex direction="column" gapY="2">
              <Heading>Hi, my name is Sara!</Heading>
              <Text>I&apos;m preparing this content for you.</Text>
            </Flex>
          </Flex>
        </Flex>
      </RenderableResourceContent>
    </Flex>
  )
}

export default SaraLoading
