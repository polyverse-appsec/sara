'use client'

import React, { useEffect, useState } from 'react'
import { type SaraSession } from 'auth' // Ensure this is correctly imported
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

import { ChatScrollAnchor } from '../chat-scroll-anchor'
import {
  type ChatPartDeux,
  type ChatQueryPartDeux,
  type ProjectHealthStatusValue,
} from './../../lib/data-model-types'
import { cn } from './../../lib/utils'
import LoadingSpinner from './../loading-spinner'
import SaraChatList from './sara-chat-list'
import SaraChatPanel from './sara-chat-panel'

interface SaraChatProps {
  projectHealth: ProjectHealthStatusValue
  chatableResourceUrl: string
  existingChatId: string | null
}

const buildChat = async (
  query: string,
  chatableResourceUrl: string,
): Promise<ChatPartDeux> => {
  const chatBody = {
    query,
  }

  const postChatUrl = chatableResourceUrl.endsWith('/')
    ? `${chatableResourceUrl}chats`
    : `${chatableResourceUrl}/chats`

  const postChatRes = await fetch(postChatUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(chatBody),
  })

  if (!postChatRes.ok) {
    const resErrText = await postChatRes.text()
    const errMsg = `Failed to build chat for resource '${chatableResourceUrl}' because: ${resErrText}`
    console.debug(errMsg)
    throw new Error(errMsg)
  }

  const chat = (await postChatRes.json()) as ChatPartDeux

  return chat
}

const submitQueryToExistingChat = async (
  query: string,
  prevChatQueryId: string,
  chatQueriesUrl: string,
) => {
  const reqBody = {
    prevChatQueryId,
    query,
  }

  const postChatQueryRes = await fetch(`${chatQueriesUrl}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reqBody),
  })

  if (!postChatQueryRes.ok) {
    const resErrText = await postChatQueryRes.text()
    const errMsg = `Failed to make new chat query: ${resErrText}`
    console.debug(errMsg)
    throw new Error(errMsg)
  }
}

const buildChatQueriesUrl = (chatableResourceUrl: string, chatId: string) =>
  chatableResourceUrl.endsWith('/')
    ? `${chatableResourceUrl}chats/${chatId}/chat-queries`
    : `${chatableResourceUrl}/chats/${chatId}/chat-queries`

const SaraChat = ({
  projectHealth,
  chatableResourceUrl,
  existingChatId = null,
}: SaraChatProps) => {
  const [chatQueries, setChatQueries] = useState<ChatQueryPartDeux[] | null>(
    null,
  )
  const [input, setInput] = useState('')
  const [chatId, setChatId] = useState<string | null>(existingChatId)
  const { data: session } = useSession()
  const saraSession = session as SaraSession | null // Handling session data properly

  useEffect(() => {
    let isMounted = true
    const fetchChatQueriesFrequencyMilliseconds = 5000

    const fetchChatQueries = async () => {
      if (!chatId) {
        if (isMounted) {
          setTimeout(fetchChatQueries, fetchChatQueriesFrequencyMilliseconds)
        }
        return
      }

      const chatQueriesUrl = buildChatQueriesUrl(chatableResourceUrl, chatId)
      try {
        const chatQueriesRes = await fetch(chatQueriesUrl)

        if (!chatQueriesRes.ok) {
          const errText = await chatQueriesRes.text()
          console.debug(
            `Failed to get a success response when fetching chat queries because: ${errText}`,
          )
          return
        }

        const fetchedChatQueries =
          (await chatQueriesRes.json()) as ChatQueryPartDeux[]
        if (isMounted) {
          setChatQueries(fetchedChatQueries)
        }
      } catch (err) {
        console.debug(`Failed to fetch chat queries because: ${err}`)
      } finally {
        if (isMounted) {
          setTimeout(fetchChatQueries, fetchChatQueriesFrequencyMilliseconds)
        }
      }
    }

    fetchChatQueries()

    return () => {
      isMounted = false
    }
  }, [chatableResourceUrl, chatId])

  if (!chatQueries) {
    return <LoadingSpinner />
  }
  if (!saraSession) {
    return null
  }

  return (
    <>
      <div className={cn('pb-[200px] pt-4 md:pt-10')}>
        {chatQueries.length ? (
          <>
            <SaraChatList
              chatQueries={chatQueries}
              isLoading={true}
              saraSession={saraSession}
            />
            <ChatScrollAnchor trackVisibility={false} />
          </>
        ) : null}
      </div>
      <SaraChatPanel
        projectHealth={projectHealth}
        chatQueries={chatQueries}
        input={input}
        setInput={setInput}
        onQuerySubmit={async (query: string) => {
          try {
            // Check to see if we have a chat in the first place...
            if (!chatId) {
              const chat = await buildChat(query, chatableResourceUrl)

              // Once we build our chat which includes our intial chat query be
              // sure to flag that we shouldn't try to build it again and return
              // so we don't try to make a query to an existing chat
              setChatId(chat.id)
              return
            }

            if (!chatQueries) {
              toast.error(
                `Previous chat query unknown and required for chat submission`,
              )
              return
            }

            const chatQueriesUrl = buildChatQueriesUrl(
              chatableResourceUrl,
              chatId,
            )

            const prevChatQueryId = chatQueries[chatQueries.length - 1].id

            await submitQueryToExistingChat(
              query,
              prevChatQueryId,
              chatQueriesUrl,
            )
          } catch (error) {
            toast.error(`Failed to make chat query because: ${error}`)
          }
        }}
      />
    </>
  )
}

export default SaraChat
