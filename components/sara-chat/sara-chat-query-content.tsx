'use client'

import Image from 'next/image'
import { Card, Flex, Progress, Text } from '@radix-ui/themes'
import GreenSolidCheckIcon from 'components/icons/GreenSolidCheckIcon'
import RedSolidStopIcon from 'components/icons/RedSolidStopIcon'
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
  chatAvatarDetails?: ChatAvatarDetails
  chatQueryStatus?: ChatQueryStatus
  querySubmittedAt?: Date
  responseReceivedAt?: Date
}

const renderAvatar = (
  contentType: 'QUERY' | 'RESPONSE',
  chatAvatarDetails?: ChatAvatarDetails,
) => {
  if (contentType === 'QUERY' && chatAvatarDetails) {
    return (
      <Image
        src={chatAvatarDetails.pictureSrc}
        alt={chatAvatarDetails.name}
        title={chatAvatarDetails.name}
        width={32}
        height={32}
        className="rounded-full"
      />
    )
  }

  if (contentType === 'QUERY') {
    return <IconUser />
  }

  return (
    <Image
      src={Sara32x32}
      alt="Sara Architecture Assistant"
      title="Sara Architecture Assistant"
    />
  )
}

function formatDateTimeSinceOperationOccurred(dateInput?: Date): string {
    if (!dateInput) return 'awhile ago';

    const now = new Date();
    const date = new Date(dateInput);
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
        return `${seconds} seconds ago`;
    } else if (minutes < 60) {
        return `${minutes} minutes ago`;
    } else if (hours < 24 && date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (days === 1 && new Date(Date.now() - 86400000).toDateString() === date.toDateString()) {
        return `${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} yesterday`;
    } else if (days < 7) {
        return `${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
    } else {
        const currentYear = now.getFullYear();
        const submittedYear = date.getFullYear();
        const optionsDate: Intl.DateTimeFormatOptions = {
            month: 'long',
            day: 'numeric',
            ...(submittedYear !== currentYear && { year: 'numeric' })
        };

        const formattedDate = new Intl.DateTimeFormat('en-US', optionsDate).format(date);
        const formattedTime = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);

        return `${formattedTime} on ${formattedDate}`;
    }
}
const renderQuerySubmittedAt = (querySubmittedAt?: Date) => {
    const timeStr = formatDateTimeSinceOperationOccurred(querySubmittedAt);

    return (
        <Flex gap="1">
            <Text size="2">
                {'You asked '}
            </Text>
            <Text size="2">{timeStr}</Text>
        </Flex>
    );
}


const renderLastCheckedAt = (lastCheckedTime?: Date) => {
  const timeStr = formatDateTimeSinceOperationOccurred(lastCheckedTime);

  return (
    <Flex gap="1">
      <Text size="2">
        {'Sara checked '}
      </Text>
      <Text size="2">{timeStr}</Text>
    </Flex>
  )
}

const renderResponseReceivedAt = (responseReceivedAt?: Date) => {
    const timeStr = formatDateTimeSinceOperationOccurred(responseReceivedAt);

  return (
    <Flex gap="1">
      <Text size="2">
        {'Sara answered '}
      </Text>
      <Text size="2">{timeStr}</Text>
    </Flex>
  )
}

const renderTimestamp = (
  contentType: 'QUERY' | 'RESPONSE',
  querySubmittedAt?: Date,
  responseReceivedAt?: Date,
) => {
  if (contentType === 'QUERY') {
    return renderQuerySubmittedAt(querySubmittedAt)
  }

  // If we don't have a response time yet then just show the last updated time
  if (!responseReceivedAt) {
    return renderLastCheckedAt()
  }

  return renderResponseReceivedAt(responseReceivedAt)
}

const renderChatQueryStatusIcon = (chatQueryStatus?: ChatQueryStatus) => {
  if (!chatQueryStatus) {
    return null
  }

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
      return <RedSolidStopIcon />
  }
}

const renderChatQueryStatusText = (chatQueryStatus?: ChatQueryStatus) => {
  if (!chatQueryStatus) {
    return null
  }

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

const FOUR_MINS_IN_MILLIS = 4 * 60 * 1000

const renderChatQueryProgressBar = (querySubmittedAt: Date) => {
  const progressPercentage = Math.floor(
    ((new Date().getTime() - new Date(querySubmittedAt).getTime()) /
      FOUR_MINS_IN_MILLIS) *
      100,
  )

  return (
    <Flex maxWidth="260px">
      <Progress value={progressPercentage} />
    </Flex>
  )
}

const renderChatQueryProgressUpdate = (querySubmittedAt: Date) => {
  const progressPercentage = Math.floor(
    ((new Date().getTime() - new Date(querySubmittedAt).getTime()) /
      FOUR_MINS_IN_MILLIS) *
      100,
  )

  switch (true) {
    case progressPercentage <= 20:
      return (
        <Flex gap="1">
          <Text size="2" weight="bold">
            {'Update: '}
          </Text>
          <Text size="2">Analyzing Question</Text>
        </Flex>
      )
    case progressPercentage <= 40:
      return (
        <Flex gap="1">
          <Text size="2" weight="bold">
            {'Update: '}
          </Text>
          <Text size="2">Researching Question</Text>
        </Flex>
      )
    case progressPercentage <= 60:
      return (
        <Flex gap="1">
          <Text size="2" weight="bold">
            {'Update: '}
          </Text>
          <Text size="2">Answering Question</Text>
        </Flex>
      )
    case progressPercentage <= 80:
      return (
        <Flex gap="1">
          <Text size="2" weight="bold">
            {'Update: '}
          </Text>
          <Text size="2">Formatting Answer</Text>
        </Flex>
      )
    case progressPercentage <= 100:
      return (
        <Flex gap="1">
          <Text size="2" weight="bold">
            {'Update: '}
          </Text>
          <Text size="2">Returning Answer</Text>
        </Flex>
      )
  }
}

function renderSideChatDetails(
  contentType: 'QUERY' | 'RESPONSE',
  chatAvatarDetails?: ChatAvatarDetails,
  chatQueryStatus?: ChatQueryStatus,
  querySubmittedAt?: Date,
  responseReceivedAt?: Date,
) {
  return (
    <Flex direction="column" maxWidth="280px">
      <Card>
        <Flex direction="column" width="260px" gap="1">
          {renderAvatar(contentType, chatAvatarDetails)}
          {renderTimestamp(contentType, querySubmittedAt, responseReceivedAt)}
          <Flex align="center" gap="1">
            {renderChatQueryStatusIcon(chatQueryStatus)}
            {renderChatQueryStatusText(chatQueryStatus)}
          </Flex>
          {chatQueryStatus === 'QUERY_SUBMITTED' && querySubmittedAt
            ? renderChatQueryProgressBar(querySubmittedAt)
            : null}
          {chatQueryStatus === 'QUERY_SUBMITTED' && querySubmittedAt
            ? renderChatQueryProgressUpdate(querySubmittedAt)
            : null}
        </Flex>
      </Card>
    </Flex>
  )
}

const SaraChatQueryContent = ({
  content,
  contentType,
  chatAvatarDetails,
  chatQueryStatus,
  querySubmittedAt,
  responseReceivedAt,
  ...props
}: SaraChatQueryContentProps) => {
  return (
    <div className={cn('group relative mb-4 flex items-start')} {...props}>
      {renderSideChatDetails(
        contentType,
        chatAvatarDetails,
        chatQueryStatus,
        querySubmittedAt,
        responseReceivedAt,
      )}
      <div className="flex-1 px-1 ml-4 space-y-2 overflow-auto" style={{ maxWidth: 'calc(100vh)' }}>
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
