'use client'

import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

import {
  type ChatQueryPartDeux,
  type ProjectHealthStatusValue,
} from './../../lib/data-model-types'
import { cn } from './../../lib/utils'
import LoadingSpinner from './../loading-spinner'
import SaraChatList from './sara-chat-list'
import SaraChatPanel from './sara-chat-panel'

interface SaraChatProps {
  chatQueriesUrl: string
  projectHealth: ProjectHealthStatusValue
}

const SaraChat = ({ chatQueriesUrl, projectHealth }: SaraChatProps) => {
  const [chatQueries, setChatQueries] = useState<ChatQueryPartDeux[] | null>(
    null,
  )

  const [input, setInput] = useState('');

  useEffect(() => {
    let isMounted = true
    const fetchChatQueriesFrequencyMilliseconds = 5000

    const fetchChatQuerires = async () => {
      try {
        const chatQueriesRes = await fetch(chatQueriesUrl)

        if (!chatQueriesRes.ok) {
          const errText = await chatQueriesRes.text()

          // TODO: How do I want to raise this info/visibility to the user
          console.debug(
            `Failed to get a success response when fetching chat queries because: ${errText}`,
          )

          if (isMounted) {
            setTimeout(fetchChatQuerires, fetchChatQueriesFrequencyMilliseconds)
          }

          return
        }

        const fetchedChatQueries =
          (await chatQueriesRes.json()) as ChatQueryPartDeux[]

        setChatQueries(fetchedChatQueries)

        if (isMounted) {
          setTimeout(fetchChatQuerires, fetchChatQueriesFrequencyMilliseconds)
        }
      } catch (err) {
        console.debug(`Failed to fetch chat queries because: ${err}`)

        if (isMounted) {
          setTimeout(fetchChatQuerires, fetchChatQueriesFrequencyMilliseconds)
        }
      }
    }

    fetchChatQuerires()

    return () => {
      isMounted = false
    }
  }, [])

  if (!chatQueries) {
    return <LoadingSpinner />
  }

  // TODO: Cut for now this             <ChatScrollAnchor trackVisibility={isLoading} />
  // TODO: Cut the below for now
  // (
  //   <EmptyScreen
  //     id={chat.id}
  //     append={updateAssistantAndAppend}
  //     setInput={setInput}
  //   />
  // )

  return (
    <>
      <div className={cn('pb-[200px] pt-4 md:pt-10')}>
        {chatQueries.length ? (
          <>
            <SaraChatList chatQueries={chatQueries} isLoading={true} />
          </>
        ) : null}
      </div>
      <SaraChatPanel
        projectHealth={projectHealth}
        chatQueries={chatQueries}
        input={input}
        setInput={setInput}
        onQuerySubmit={async (query: string) => {
          const reqBody = {
            prevChatQueryId: chatQueries[chatQueries.length - 1].id,
            query,
          }

          try {
            const res = await fetch(`${chatQueriesUrl}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(reqBody),
            })

            if (!res.ok) {
              const errText = await res.text()
              console.debug(`Failed to make new chat query: ${errText}`)
              toast.error(`Failed to make new chat query`)
              return
            }

            const chatQuery = await res.json()
          } catch (err) {
            console.debug(`Failed to make new chat query: ${err}`)
            toast.error(`Failed to make new chat query`)
          }
        }}
      />
    </>
  )
}

export default SaraChat
