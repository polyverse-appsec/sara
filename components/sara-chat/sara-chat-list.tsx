'use client'

import { SaraSession } from 'auth'
import SaraLoading from 'components/sara-loading'

import { ChatQuery } from './../../lib/data-model-types'
import { Separator } from './../ui/separator'
import SaraChatQueryContent from './sara-chat-query-content'
import { IconRefresh } from 'components/ui/icons'
import { isPreviewFeatureEnabled } from 'lib/service-utils'

export interface SaraChatListProps {
  chatQueries: ChatQuery[]
  saraSession: SaraSession
}

const SaraChatList = ({ chatQueries, saraSession }: SaraChatListProps) => {
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
              chatAvatarDetails={
                saraSession.picture
                  ? { pictureSrc: saraSession.picture, name: saraSession.name }
                  : undefined
              }
            />
            <br></br>
            {chatQuery.response ? (
              <div className="flex flex-col items-center">
                <SaraChatQueryContent
                  content={chatQuery.response}
                  contentType="RESPONSE"
                  timestamp={chatQuery.responseReceivedAt}
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
                {isPreviewFeatureEnabled('RegenerateResponse') && (
                 <button
                  className="flex items-center p-2 border-2 border-invisible hover:border-black text-sm leading-5 font-medium rounded-md text-black mb-2"
                >
                  <IconRefresh className="mr-2" />
                  <p>Regenerate response</p>
                </button>
                )}
              </div>
            ) : (
              <>
                <SaraChatQueryContent
                  content={''}
                  contentType="RESPONSE"
                  timestamp={new Date()}
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
