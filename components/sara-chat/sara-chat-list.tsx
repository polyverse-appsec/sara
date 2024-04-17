'use client'

import { SaraSession } from 'auth'
import SaraLoading from 'components/sara-loading'
import { IconRefresh } from 'components/ui/icons'

import { ChatQuery } from './../../lib/data-model-types'
import { Separator } from './../ui/separator'
import SaraChatQueryContent from './sara-chat-query-content'
import { updateResource } from 'app/saraClient'

export interface SaraChatListProps {
  chatId: string | undefined
  chatQueries: ChatQuery[]
  saraSession: SaraSession
}

const buildChatQueryUrl = (chatId: string, chatQueryId: string) =>
  `/api/chats/${chatId}/chat-queries/${chatQueryId}`

const SaraChatList = ({ chatId, chatQueries, saraSession }: SaraChatListProps) => {
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
                {(index == chatQueries.length - 1) && (
                  <button 
                    className="flex items-center p-2 border-2 border-invisible hover:border-black text-sm leading-5 font-medium rounded-md text-black mb-2"
                    onClick={async (e) => {
                      const chatQueryUrl = buildChatQueryUrl(chatId!, chatQuery.id)
                      const patchReqBody = {
                        status: 'QUERY_RECEIVED',
                      }

                      const resubmittedChatQuery = await updateResource<ChatQuery>(
                        chatQueryUrl,
                        patchReqBody,
                        `Failed to re-submit chat query '${chatQuery.id}' when in an 'ERROR' state`,
                      )

                      chatQueries[chatQueries.length - 1] = resubmittedChatQuery
                    }}
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
