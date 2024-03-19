'use client'

import { SaraSession } from 'auth'

import { ChatQueryPartDeux } from './../../lib/data-model-types'
import { Separator } from './../ui/separator'
import SaraChatQueryContent from './sara-chat-query-content'

export interface SaraChatListProps {
  chatQueries: ChatQueryPartDeux[]

  /**
   * Indicates whether we are currently in the midst of a chat with OpenAI.
   */
  isLoading: boolean
  saraSession: SaraSession
}

const SaraChatList = ({
  chatQueries,
  isLoading,
  saraSession,
}: SaraChatListProps) => {
  if (!chatQueries.length) {
    return null
  }

  // TODO: Cut the below for now from the original
  //   {index < messages.length - 1 && (
  //     <Separator className="my-4 md:my-8" />
  //   )}

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {chatQueries.map((chatQuery, index) => {
        return (
          <div key={index}>
            <Separator className="my-4 md:my-8" />
            <SaraChatQueryContent
              content={chatQuery.query}
              contentType="QUERY"
              shouldRenderLoadingSpinner={
                chatQuery.status === 'QUERY_SUBMITTED'
              }
              saraSession={saraSession}
            />
            <br></br>
            {chatQuery.response ? (
              <>
                <SaraChatQueryContent
                  content={chatQuery.response}
                  contentType="RESPONSE"
                  shouldRenderLoadingSpinner={false}
                  saraSession={saraSession}
                />
              </>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export default SaraChatList
