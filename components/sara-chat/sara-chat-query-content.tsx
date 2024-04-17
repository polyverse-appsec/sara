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
    case 'CANCELLED':
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
    case 'CANCELLED':
      return (
        <>
          <Text size="2" weight="bold">
            {'Status: '}
          </Text>
          <Text size="2">Cancelled</Text>
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
  chatAvatarDetails,
  chatQueryStatus,
  ...props
}: SaraChatQueryContentProps) => {
  return (
    <div className={cn('group relative mb-4 flex items-start')} {...props}>
      {renderSideChatDetails(
        contentType,
        timestamp,
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
