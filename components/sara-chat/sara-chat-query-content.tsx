'use client'

import Image from 'next/image'
import { Card, Flex, Text } from '@radix-ui/themes'
import GreenSolidCheckIcon from 'components/icons/GreenSolidCheckIcon'
import RedSolidXIcon from 'components/icons/RedSolidXIcon'
import LoadingSpinner from 'components/loading-spinner'
import { ChatQueryStatus } from 'lib/data-model-types'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '../../lib/utils'
import { MemoizedReactMarkdown } from '../markdown'
import { CodeBlock } from '../ui/codeblock'
import { IconUser } from '../ui/icons'
import Sara32x32 from './../../public/Sara_Cartoon_Portrait-32x32.png'

export interface ChatAvatarDetails {
  name: string
  pictureSrc: string
}

export interface SaraChatQueryContentProps {
  content: string
  contentType: 'QUERY' | 'RESPONSE'
  timestamp: Date | null

  /**
   * Indicates whether we are currently in the midst of a chat with OpenAI.
   * Required or else we will always so a loading spinner.
   */
  shouldRenderLoadingSpinner: boolean
  chatAvatarDetails?: ChatAvatarDetails
  chatQueryStatus?: ChatQueryStatus
}

const renderChatQueryStatusIcon = (chatQueryStatus: ChatQueryStatus) => {
  switch (chatQueryStatus) {
    case 'QUERY_RECEIVED':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 fill-blue-500"
        >
          <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 0 1-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 0 1-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 0 1-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584ZM12 18a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'QUERY_SUBMITTED':
      return <LoadingSpinner />
    case 'RESPONSE_RECEIVED':
      return <GreenSolidCheckIcon />
    case 'ERROR':
      return <RedSolidXIcon />
  }
}

const renderChatQueryStatusText = (chatQueryStatus: ChatQueryStatus) => {
  switch (chatQueryStatus) {
    case 'QUERY_RECEIVED':
      return (
        <>
          <Text size="2" weight="bold">
            {'Status: '}
          </Text>
          <Text size="2">Submitting</Text>
        </>
      )
    case 'QUERY_SUBMITTED':
      return (
        <>
          <Text size="2" weight="bold">
            {'Status: '}
          </Text>
          <Text size="2">Processing</Text>
        </>
      )
    case 'RESPONSE_RECEIVED':
      return (
        <>
          <Text size="2" weight="bold">
            {'Status: '}
          </Text>
          <Text size="2">Complete</Text>
        </>
      )
    case 'ERROR':
      return (
        <>
          <Text size="2" weight="bold">
            {'Status: '}
          </Text>
          <Text size="2">Error</Text>
        </>
      )
  }
}

const renderChatQueryStatusCard = (chatQueryStatus?: ChatQueryStatus) => {
  if (!chatQueryStatus) {
    return null
  }

  return (
    <Card>
      <Flex gap="1" align="center">
        {renderChatQueryStatusIcon(chatQueryStatus)}
        {renderChatQueryStatusText(chatQueryStatus)}
      </Flex>
    </Card>
  )
}

function renderSideChatDetails(
  contentType: 'QUERY' | 'RESPONSE',
  timestamp: Date | null,
  shouldRenderLoadingSpinner: boolean,
  chatAvatarDetails?: ChatAvatarDetails,
  chatQueryStatus?: ChatQueryStatus,
) {
  return (
    <div className={'flex flex-col items-start w-[180px]'}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
          contentType === 'QUERY'
            ? 'bg-background'
            : 'bg-primary text-primary-foreground',
        )}
      >
        {contentType === 'QUERY' ? (
          chatAvatarDetails ? (
            <Image
              src={chatAvatarDetails.pictureSrc}
              alt={chatAvatarDetails.name}
              title={chatAvatarDetails.name}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <IconUser />
          )
        ) : (
          <>
            <Image
              src={Sara32x32}
              alt="Sara Architecture Assistant"
              title="Sara Architecture Assistant"
            />
          </>
        )}
      </div>
      {shouldRenderLoadingSpinner ? (
        <svg
          aria-hidden="true"
          className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600 mt-2" // Added margin-top (mt-2) to position below the image
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
      ) : null}
      {timestamp ? (
        <div className="prose">
          {new Date(timestamp).toLocaleDateString()}
          <br />
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      ) : null}
      {renderChatQueryStatusCard(chatQueryStatus)}
    </div>
  )
}

const SaraChatQueryContent = ({
  content,
  contentType,
  timestamp,
  shouldRenderLoadingSpinner,
  chatAvatarDetails,
  chatQueryStatus,
  ...props
}: SaraChatQueryContentProps) => {
  return (
    <div className={cn('group relative mb-4 flex items-start')} {...props}>
      {renderSideChatDetails(
        contentType,
        timestamp,
        shouldRenderLoadingSpinner,
        chatAvatarDetails,
        chatQueryStatus,
      )}
      <div className="flex-1 px-1 ml-4 space-y-2 overflow-hidden">
        <MemoizedReactMarkdown
          className="pr-16 prose-base break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              if (contentType === 'QUERY') {
                return (
                  <p className="mb-2 last:mb-0 font-semimedium">{children}</p>
                )
              } else {
                return <p className="mb-2 last:mb-0">{children}</p>
              }
            },
            code({ node, inline, className, children, ...props }) {
              if (children.length) {
                if (children[0] == '▍') {
                  return (
                    <span className="mt-1 cursor-default animate-pulse">▍</span>
                  )
                }

                children[0] = (children[0] as string).replace('`▍`', '▍')
              }

              const match = /language-(\w+)/.exec(className || '')

              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ''}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              )
            },
          }}
        >
          {content}
        </MemoizedReactMarkdown>
      </div>
    </div>
  )
}

export default SaraChatQueryContent
