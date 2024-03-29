'use client'

import React, { useEffect, useState } from 'react'
import { type SaraSession } from 'auth' // Ensure this is correctly imported
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

import { ChatScrollAnchor } from '../chat-scroll-anchor'
import { getResource } from './../../app/saraClient'
import {
  type Chat,
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
): Promise<Chat> => {
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

  const chat = (await postChatRes.json()) as Chat

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
        const chatQueries =
          await getResource<ChatQueryPartDeux[]>(chatQueriesUrl)

        if (isMounted) {
          setChatQueries(chatQueries)
        }
      } catch (err) {
        // Just catch the error and log a debug statement
        console.debug(`Failed to fetch chat queries because: ${err}`)
      }

      if (isMounted) {
        setTimeout(fetchChatQueries, fetchChatQueriesFrequencyMilliseconds)
      }
    }

    fetchChatQueries()

    return () => {
      isMounted = false
    }
  }, [chatableResourceUrl, chatId])

  if (!saraSession) {
    return null
  }

  return (
    <>
      <div className={cn('pb-[200px] pt-4')}>
        {chatQueries && chatQueries.length ? (
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

            // If we are here it means we already created a Chat REST resource
            // and we need to check its associated chat queries. We check that
            // the last chat query has received a response or isn't in an error
            // state in order to allow a query to take place
            if (!chatQueries) {
              toast.error(
                `Previous chat query unknown and required for chat submission`,
              )
              return
            }

            if (chatQueries.length > 0) {
              const lastChatQuery = chatQueries[chatQueries.length - 1]

              if (lastChatQuery.status === 'ERROR') {
                toast.error(
                  'Unable to submit new chat query - previous chat query in error state',
                )
                return
              }

              if (lastChatQuery.status !== 'RESPONSE_RECEIVED') {
                toast.custom(
                  'Unable to submit new chat query - previous chat query in error state',
                )
                return
              }
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
