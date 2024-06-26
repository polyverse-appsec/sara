'use client'

import {
  createResourceNoResponseBody,
  updateResource,
  updateResourceNoResponseBody,
} from 'app/saraClient'
import { SaraSession } from 'auth'
import { ChatContentTypeQuery } from 'components/chat/chat-query-content'
import SaraLoading from 'components/sara-loading'
import { IconRefresh } from 'components/ui/icons'

import {
  type ChatQuery,
  type FineTuningTags,
} from './../../lib/data-model-types'
import { Separator } from './../ui/separator'
import SaraChatQueryContent from './sara-chat-query-content'

const buildFineTuningUrl = (chatId: string, chatQueryId: string) =>
  `/api/chats/${chatId}/chat-queries/${chatQueryId}/fine-tuning`

export interface SaraChatListProps {
  chatQueries: ChatQuery[]
  saraSession: SaraSession
  handleResubmitChatQuery?: (chatQueryId: string) => {}
}

const SaraChatList = ({
  chatQueries,
  saraSession,
  handleResubmitChatQuery,
}: SaraChatListProps) => {
  if (!chatQueries.length) {
    return null
  }

  const fineTuningTagsModifiedClosure =
    (chatId: string, chatQueryId: string) =>
    async (fineTuningTags: FineTuningTags[]) => {
      const fineTuningUrl = buildFineTuningUrl(chatId, chatQueryId)

      const postReqBody = {
        fineTuningTags,
      }

      await createResourceNoResponseBody(
        fineTuningUrl,
        postReqBody,
        'Failed to set the fine tuning tags',
      )
    }

  return (
    <div className="relative mx-8 px-4">
      {chatQueries.map((chatQuery, index) => {
        return (
          <div key={index}>
            <Separator className="my-4" />
            <SaraChatQueryContent
              content={chatQuery.query}
              contentType={ChatContentTypeQuery}
              querySubmittedAt={chatQuery.querySubmittedAt}
              chatAvatarDetails={
                saraSession.picture
                  ? { pictureSrc: saraSession.picture, name: saraSession.name }
                  : undefined
              }
              fineTuningTags={
                chatQuery.fineTuningTags ? chatQuery.fineTuningTags : []
              }
              onFineTuningTagsModified={fineTuningTagsModifiedClosure(
                chatQuery.chatId,
                chatQuery.id,
              )}
            />
            <br></br>
            {chatQuery.response ? (
              // overflow auto for now, but need to figure out how to wrap this response text properly
              <div className="flex flex-col items-start overflow-auto">
                <SaraChatQueryContent
                  content={chatQuery.response}
                  contentType="RESPONSE"
                  responseReceivedAt={
                    chatQuery.responseReceivedAt
                      ? chatQuery.responseReceivedAt
                      : undefined
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
                  fineTuningTags={
                    chatQuery.fineTuningTags ? chatQuery.fineTuningTags : []
                  }
                  onFineTuningTagsModified={fineTuningTagsModifiedClosure(
                    chatQuery.chatId,
                    chatQuery.id,
                  )}
                />
                {index == chatQueries.length - 1 && (
                  <div className="w-full flex items-center justify-center">
                    <button
                      className="flex items-center p-2 border-2 border-invisible hover:border-black text-sm leading-5 font-medium rounded-md text-gray"
                      onClick={() => {
                        if (handleResubmitChatQuery) {
                          handleResubmitChatQuery(chatQuery.id)
                        }
                      }}
                    >
                      <IconRefresh className="mr-2" />
                      <p>Regenerate response</p>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <SaraChatQueryContent
                  content={''}
                  contentType="RESPONSE"
                  chatQueryStatus={
                    index === chatQueries.length - 1
                      ? chatQuery.status
                      : undefined
                  }
                  querySubmittedAt={chatQuery.querySubmittedAt}
                  fineTuningTags={
                    chatQuery.fineTuningTags ? chatQuery.fineTuningTags : []
                  }
                  onFineTuningTagsModified={fineTuningTagsModifiedClosure(
                    chatQuery.chatId,
                    chatQuery.id,
                  )}
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
