'use client'

import React, { useEffect, useState } from 'react'
import { type SaraSession } from 'auth' // Ensure this is correctly imported

import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

import { ChatScrollAnchor } from '../chat-scroll-anchor'
import {
  createResource,
  createResourceNoResponseBody,
  getResource,
  updateResource,
} from './../../app/saraClient'
import {
  FineTuningTags,
  type Chat,
  type Chatable,
  type ChatQuery,
  type ProjectHealthStatusValue,
} from './../../lib/data-model-types'
import { cn } from './../../lib/utils'
import SaraChatList from './sara-chat-list'
import SaraChatPanel from './sara-chat-panel'

interface SaraChatProps {
  projectHealth: ProjectHealthStatusValue
  chatableResourceUrl: string
  existingChatId?: string
  initialChatQuery?: string
  autoPromptClicked?: boolean
  onChatCreated?: (chatId: string) => void
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

  return await createResource<Chat>(
    postChatUrl,
    chatBody,
    `Failed to build chat for '${chatableResourceUrl}'`,
  )
}

const resubmitChatQuery = async (
  chatId: string,
  tailChatQueryId: string,
): Promise<ChatQuery> => {
  const chatQueryUrl = buildChatQueryUrl(chatId, tailChatQueryId)
  const patchReqBody = {
    status: 'QUERY_RECEIVED',
  }

  return await updateResource<ChatQuery>(
    chatQueryUrl,
    patchReqBody,
    `Failed to re-submit chat query '${tailChatQueryId}'`,
  )
}

const cancelChatQuery = async (
  chatId: string,
  tailChatQueryId: string,
): Promise<ChatQuery> => {
  const chatQueryUrl = buildChatQueryUrl(chatId, tailChatQueryId)
  const patchReqBody = {
    status: 'CANCELLED',
  }

  return await updateResource<ChatQuery>(
    chatQueryUrl,
    patchReqBody,
    `Failed to cancel chat query '${tailChatQueryId}'`,
  )
}

const FOUR_MINS_IN_MILLIS = 4 * 60 * 1000

const querySubmissionExpired = (querySubmittedAt: Date): boolean =>
  new Date().getTime() - new Date(querySubmittedAt).getTime() >=
  FOUR_MINS_IN_MILLIS

const buildChatQueriesUrl = (chatableResourceUrl: string, chatId: string) =>
  chatableResourceUrl.endsWith('/')
    ? `${chatableResourceUrl}chats/${chatId}/chat-queries`
    : `${chatableResourceUrl}/chats/${chatId}/chat-queries`

const buildChatQueryUrl = (chatId: string, chatQueryId: string) =>
  `/api/chats/${chatId}/chat-queries/${chatQueryId}`

const SaraChat = <T extends Chatable>({
  projectHealth,
  chatableResourceUrl,
  existingChatId,
  initialChatQuery,
  autoPromptClicked,
  onChatCreated,
}: SaraChatProps) => {
  const [chatQueries, setChatQueries] = useState<ChatQuery[] | null>(null)
  const [chatQuery, setChatQuery] = useState<string>('')
  const [chatId, setChatId] = useState<string | undefined>(existingChatId)
  const { data: session } = useSession()
  const saraSession = session as SaraSession | null // Handling session data properly

  useEffect(() => {
    let isMounted = true
    let fetchChatQueriesFrequencyMilliseconds = 20000

    if (process.env.DEFAULT_CHAT_POLLING_CYCLE_SECS) {
      try {
        fetchChatQueriesFrequencyMilliseconds =
          Number(process.env.DEFAULT_CHAT_POLLING_CYCLE_SECS) * 1000
      } catch (error) {
        console.error(
          'Failed to convert `DEFAULT_CHAT_POLLING_CYCLE_SECS` to a number',
        )
      }
    }

    const fetchChatQueries = async () => {
      if (!chatId) {
        if (isMounted) {
          setTimeout(fetchChatQueries, fetchChatQueriesFrequencyMilliseconds)
        }
        return
      }

      const chatQueriesUrl = buildChatQueriesUrl(chatableResourceUrl, chatId)

      try {
        const chatQueries = await getResource<ChatQuery[]>(chatQueriesUrl)
        const tailChatQuery = chatQueries[chatQueries.length - 1]

        // If the chat ended in an error state then re-submit the chat for the
        // user
        if (isMounted && tailChatQuery.status === 'ERROR') {
          const resubmittedChatQuery = await resubmitChatQuery(
            chatId,
            tailChatQuery.id,
          )

          chatQueries[chatQueries.length - 1] = resubmittedChatQuery
        }

        // If the chat has ran for to long then we will cancel it and the user
        // can re-submit it themselves if they would like
        if (
          isMounted &&
          tailChatQuery.status === 'QUERY_SUBMITTED' &&
          querySubmissionExpired(tailChatQuery.querySubmittedAt)
        ) {
          const cancelledChatQuery = await cancelChatQuery(
            chatId,
            tailChatQuery.id,
          )

          chatQueries[chatQueries.length - 1] = cancelledChatQuery
        }

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

  // If someone provides an initial chat query set our state to it
  useEffect(() => {
    if (initialChatQuery) {
      setChatQuery(initialChatQuery)
    }
  }, [initialChatQuery])

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
              saraSession={saraSession}
              handleResubmitChatQuery={async (chatQueryId: string) => {
                // If the chat ID isn't available yet return
                if (!chatId) {
                  return
                }

                const chatQueryUrl = buildChatQueryUrl(chatId, chatQueryId)
                const patchReqBody = {
                  status: 'QUERY_RECEIVED',
                }

                const resubmittedChatQuery = await updateResource<ChatQuery>(
                  chatQueryUrl,
                  patchReqBody,
                  `Failed to re-submit chat query '${chatQueryId}'`,
                )

                // By default the we only allow resubmitting on the last chat
                // query so we can locally update our state here while waiting
                // for the next refresh
                chatQueries[chatQueries.length - 1] = resubmittedChatQuery
                setChatQueries(chatQueries)
              }}
            />
            <ChatScrollAnchor trackVisibility={false} />
          </>
        ) : null}
      </div>
      <SaraChatPanel
        projectHealth={projectHealth}
        input={chatQuery}
        setInput={setChatQuery}
        autoPromptClicked={autoPromptClicked}
        onQuerySubmit={async (query: string) => {
          try {
            // Check to see if we have a chat in the first place...
            if (!chatId) {
              const chat = await buildChat(query, chatableResourceUrl)

              // Once we build our chat which includes our intial chat query be
              // sure to flag that we shouldn't try to build it again and return
              // so we don't try to make a query to an existing chat
              setChatId(chat.id)

              if (onChatCreated) {
                onChatCreated(chat.id)
              }

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

            const reqBody = {
              prevChatQueryId,
              query,
            }

            await createResourceNoResponseBody(
              chatQueriesUrl,
              reqBody,
              'Failed to make new chat query',
            )

            // To increase responsiveness immediately query for chat queries and
            // render them. We will get updated ones in the future when our
            // `useEffect` works
            const updateChatQueries =
              await getResource<ChatQuery[]>(chatQueriesUrl)
            setChatQueries(updateChatQueries)
          } catch (error) {
            toast.error(`Failed to make chat query because: ${error}`)
          }
        }}
      />
    </>
  )
}

export default SaraChat
