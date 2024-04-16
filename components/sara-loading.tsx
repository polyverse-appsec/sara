'use client'

import Image from 'next/image'
import { Flex, Heading, Text } from '@radix-ui/themes'

import SaraLoadingImg from './../public/Sara-Loading.png'

interface SaraLoadingProps {
  message?: string // The question mark makes the property optional.
}

const SaraLoading = ({
  message = `I'm preparing this content for you...`,
}: SaraLoadingProps) => {
  return (
    <Flex direction="column" align="center" justify="center" minHeight="100vh">
      <Heading size="9">{message}</Heading>
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
