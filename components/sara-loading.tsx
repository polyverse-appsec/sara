'use client'

import Image from 'next/image'
import { Flex, Heading } from '@radix-ui/themes'

import SaraLoadingImg from './../public/Sara-Loading.png'

interface SaraLoadingProps {
  message?: string
}

const SaraLoading = ({
  message = `I'm preparing this content for you...`,
}: SaraLoadingProps) => {
  return (
    <Flex direction="column" align="center" justify="center" minHeight="100vh" >
      <Flex direction="column" style={{ width: '80%', maxWidth: '900px', alignItems: 'center' }}>
        {/* Set the container width to 80% of the viewport width but not exceeding 900px */}
        <Heading size="6" style={{ width: '100%', textAlign: 'center', marginBottom: '20px' }}>
          {message}
        </Heading>
        <div style={{ width: '60%', minWidth: '360px' }}> {/* Ensure image container is 60% of the parent width */}
          <Image
            src={SaraLoadingImg}
            alt="Sara Working"
            title="Sara Working"
            layout="responsive"
            width={100}
            height={100}
          />
        </div>
      </Flex>
    </Flex>
  )
}

export default SaraLoading
