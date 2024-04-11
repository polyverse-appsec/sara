'use client'

import Image from 'next/image'
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes'
import RenderableResourceContent from 'components/renderable-resource/renderable-resource-content'

import SaraLoadingImg from './../public/Sara-Loading.png'

const SaraLoading = () => {
  return (
    <Flex direction="column" align="center" justify="center" minHeight="100vh">
      <Heading size="9">I&apos;m preparing this content for you...</Heading>
      <br />
      <br />
      <Image
        src={SaraLoadingImg}
        alt="Sara Loading"
        title="Sara Loading"
        width={700}
        height={700}
      />
    </Flex>
  )
}

export default SaraLoading
