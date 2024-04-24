'use client'

import Image from 'next/image'
import { Flex, Heading } from '@radix-ui/themes'

interface SaraLoadingProps {
  message?: string
}

const SaraLoading = ({
  message = `I'm preparing this content for you...`,
}: SaraLoadingProps) => {
  return (
    <Flex direction="column" align="center" justify="center" minHeight="100vh">
      <Flex
        direction="column"
        style={{ width: '80%', maxWidth: '900px', alignItems: 'center' }}
      >
        <Heading
          size="6"
          style={{ width: '100%', textAlign: 'center', marginBottom: '20px' }}
        >
          {message}
        </Heading>
        <div style={{ width: '60%', minWidth: '360px' }}>
          <Image
            src="/Sara-Loading.png"
            alt="Sara Working"
            title="Sara Working"
            width={1024}
            height={1024}
          />
        </div>
      </Flex>
    </Flex>
  )
}

export default SaraLoading
