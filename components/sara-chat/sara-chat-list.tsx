'use client'

import { SaraSession } from 'auth'
import SaraLoading from 'components/sara-loading'

import { ChatQuery } from './../../lib/data-model-types'
import { Separator } from './../ui/separator'
import SaraChatQueryContent from './sara-chat-query-content'

export interface SaraChatListProps {
  chatQueries: ChatQuery[]

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

  return (
    <div className="relative mx-16 px-4">
      {chatQueries.map((chatQuery, index) => {
        return (
          <div key={index}>
            <Separator className="my-4" />
            <SaraChatQueryContent
              content={chatQuery.query}
              contentType="QUERY"
              timestamp={chatQuery.querySubmittedAt}
              shouldRenderLoadingSpinner={false}
              chatAvatarDetails={
                saraSession.picture
                  ? { pictureSrc: saraSession.picture, name: saraSession.name }
                  : undefined
              }
            />
            <br></br>
            {chatQuery.response ? (
              <>
                <SaraChatQueryContent
                  content={chatQuery.response}
                  contentType="RESPONSE"
                  timestamp={chatQuery.responseReceivedAt}
                  shouldRenderLoadingSpinner={
                    chatQuery.status === 'QUERY_SUBMITTED'
                  }
                  chatAvatarDetails={
                    saraSession.picture
                      ? {
                          pictureSrc: saraSession.picture,
                          name: saraSession.name,
                        }
                      : undefined
                  }
                  chatQueryStatus={
                    index === chatQueries.length - 1
                      ? chatQuery.status
                      : undefined
                  }
                />
              </>
            ) : (
              <>
                <SaraChatQueryContent
                  content={''}
                  contentType="RESPONSE"
                  timestamp={new Date()}
                  shouldRenderLoadingSpinner={true}
                  chatQueryStatus={
                    index === chatQueries.length - 1
                      ? chatQuery.status
                      : undefined
                  }
                />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default SaraChatList
