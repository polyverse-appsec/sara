'use client'

import { useEffect, useState } from 'react'
import { Flex, Spinner, Text } from '@radix-ui/themes'

import { getResource } from './../../app/saraClient'
import RenderableResourceContent from './../../components/renderable-resource/renderable-resource-content'
import RenderableInitialChatGuideContent from './../../components/sara-chat/renderable-initial-chat-guide-content'
import RenderableSaraChatGuideContent from './../../components/sara-chat/renderable-sara-chat-guide-content'
import {
  type Chatable,
  type ProjectHealthStatusValue,
} from './../../lib/data-model-types'
import SaraChat from './sara-chat'

interface RenderableSaraChatResourceContentProps {
  projectHealth: ProjectHealthStatusValue
  chatableResourceUrl: string
}

const RenderableSaraChatResourceContent = <T extends Chatable>({
  projectHealth,
  chatableResourceUrl,
}: RenderableSaraChatResourceContentProps) => {
  const [chatableResource, setChatableResource] = useState<T | null>(null)
  const [getChatableResourceError, setGetChatableResourceError] = useState<
    string | null
  >(null)

  const [initialChatQuery, setInitialChatQuery] = useState<string | undefined>(
    undefined,
  )

  useEffect(() => {
    ;(async () => {
      try {
        const chatableResource = await getResource<T>(chatableResourceUrl)

        setChatableResource(chatableResource)
      } catch (error) {
        setGetChatableResourceError(
          JSON.stringify(error, Object.getOwnPropertyNames(error)),
        )
      }
    })()
  }, [chatableResourceUrl])

  // We preseume that someone is only rendering this component if the renderable
  // resource exists so we ought not hit 404 errors.
  if (getChatableResourceError) {
    return (
      <RenderableSaraChatGuideContent>
        <Flex align="center">
          <Text>
            I encourtered the following error setting up your chat:{' '}
            {getChatableResourceError}
          </Text>
          <Spinner ml="2" />
        </Flex>
      </RenderableSaraChatGuideContent>
    )
  }

  // If we haven't loaded the resource yet then do so now...
  if (!chatableResource) {
    return (
      <RenderableSaraChatGuideContent>
        <Flex align="center">
          <Text>I&apos;m currently setting up your chat</Text>
          <Spinner ml="2" />
        </Flex>
      </RenderableSaraChatGuideContent>
    )
  }

  // If the user hasn't actually initiated a chat then help guide them to start
  // a chat...
  if (!chatableResource.chatId) {
    return (
      <>
        <RenderableInitialChatGuideContent
          setInitialChatQuery={(initialChatQuery) => {
            setInitialChatQuery(initialChatQuery)
          }}
        />
        <SaraChat
          projectHealth={projectHealth}
          chatableResourceUrl={chatableResourceUrl}
          initialChatQuery={initialChatQuery}
          onChatCreated={(chatId: string) => {
            const newChatableResource: T = {
              ...chatableResource,
              chatId,
            }

            setChatableResource(newChatableResource)
          }}
        />
      </>
    )
  }

  // Otherwise at this point we have an existing chat ID so show the previous
  // chat details
  return (
    <RenderableResourceContent>
      <SaraChat
        projectHealth={projectHealth}
        chatableResourceUrl={chatableResourceUrl}
        existingChatId={chatableResource.chatId}
      />
    </RenderableResourceContent>
  )
}

export default RenderableSaraChatResourceContent
