'use client'

import { useState } from 'react'
import Image from 'next/image'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Card, Flex, Progress, Text } from '@radix-ui/themes'
import { SaraSession } from 'auth'
import CopyToClipboardIcon from 'components/icons/CopyToClipboardIcon'
import GreenSolidCheckIcon from 'components/icons/GreenSolidCheckIcon'
import RedSolidStopIcon from 'components/icons/RedSolidStopIcon'
import RedSolidXIcon from 'components/icons/RedSolidXIcon'
import LoadingSpinner from 'components/loading-spinner'
import { ChatQueryStatus } from 'lib/data-model-types'
import { useSession } from 'next-auth/react'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '../../lib/utils'
import { MemoizedReactMarkdown}  from '../markdown'
import MermaidWrapper from "../ui/MermaidWrapper"
import { CodeBlock } from '../ui/codeblock'
import { IconUser } from '../ui/icons'
import Sara32x32 from './../../public/Sara_Cartoon_Portrait-32x32.png'
import { ChatContentTypeQuery } from 'components/chat/chat-query-content'

export interface ChatAvatarDetails {
  name: string
  pictureSrc: string
}

type ChatContentType = 'QUERY' | 'RESPONSE'

export interface SaraChatQueryContentProps {
  content: string
  contentType: ChatContentType
  chatAvatarDetails?: ChatAvatarDetails
  chatQueryStatus?: ChatQueryStatus
  querySubmittedAt?: Date
  responseReceivedAt?: Date
}

const renderAvatar = (
  contentType: ChatContentType,
  chatAvatarDetails?: ChatAvatarDetails,
) => {
  if (contentType === ChatContentTypeQuery && chatAvatarDetails) {
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

  if (contentType === ChatContentTypeQuery) {
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

function isDateYesterday(dateToCheck: Date): boolean {
    const today = new Date(); // Get today's date
    const yesterday = new Date(today); // Create a new date object based on today

    yesterday.setDate(yesterday.getDate() - 1); // Subtract one day to get yesterday

    // Normalize both dates to midnight for accurate comparison
    const normalizedDateToCheck = new Date(dateToCheck);
    normalizedDateToCheck.setHours(0, 0, 0, 0);

    const normalizedYesterday = new Date(yesterday);
    normalizedYesterday.setHours(0, 0, 0, 0);

    return normalizedDateToCheck.getTime() === normalizedYesterday.getTime();
}

function formatDateTimeSinceOperationOccurred(dateInput?: Date, pastTime: boolean = true): string {
    if (!dateInput) {
        if (pastTime) {
            return 'moments ago'
        } else {
            return 'a moment'
        }
    }

    const now = new Date()
    const date = new Date(dateInput)
    const diff = now.getTime() - date.getTime()

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    const isYesterday = isDateYesterday(date)

    if (seconds < 60) {
        return `${seconds} seconds` + (pastTime ? ' ago' : '');
    } else if (minutes < 60) {
        return `${minutes} minutes` + (pastTime ? ' ago' : '');
    } else if (hours < 24 && !isYesterday) {
        return `at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (isDateYesterday(date)) {
        return `at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} yesterday`;
    } else if (days < 7) {
        return `at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
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

        return `at ${formattedTime} on ${formattedDate}`
    }
}
const renderQuerySubmittedAt = (querySubmittedAt?: Date) => {
    const timeStr = formatDateTimeSinceOperationOccurred(querySubmittedAt)

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
  const timeStr = formatDateTimeSinceOperationOccurred(lastCheckedTime, false)

  return (
    <Flex gap="1">
      <Text size="2">
        {'Sara thinking for '}
      </Text>
      <Text size="2">{timeStr}</Text>
    </Flex>
  )
}

const cancelledAt = (cancelledAt?: Date) => {
  const timeStr = formatDateTimeSinceOperationOccurred(cancelledAt)

  return (
    <Flex gap="1">
      <Text size="2" className="text-yellow-500">
        {'Sara stopped '}
      </Text>
      <Text size="2">{timeStr}</Text>
    </Flex>
  )
}

const errorOccurredAt = (errorAt?: Date) => {
    const timeStr = formatDateTimeSinceOperationOccurred(errorAt)

  return (
    <Flex gap="1">
      <Text size="2" className="text-red-500">
        {'Sara had a problem '}
      </Text>
      <Text size="2">{timeStr}</Text>
    </Flex>
  )
}

const renderResponseReceivedAt = (responseReceivedAt?: Date) => {
    const timeStr = formatDateTimeSinceOperationOccurred(responseReceivedAt)

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
  contentType: ChatContentType,
  chatQueryStatus?: ChatQueryStatus,
  querySubmittedAt?: Date,
  responseReceivedAt?: Date,
) => {
  if (contentType === ChatContentTypeQuery) {
    return renderQuerySubmittedAt(querySubmittedAt)
  }

  // If we don't have a response time yet then just show the last updated time
  if (!responseReceivedAt) {
    return renderLastCheckedAt(querySubmittedAt)
  }

  if (chatQueryStatus === 'ERROR') {
    return errorOccurredAt(responseReceivedAt)
  } else if (chatQueryStatus === 'CANCELLED') {
    return cancelledAt(responseReceivedAt)
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

  const elapsed = (new Date().getTime() - new Date(querySubmittedAt).getTime()) / 1000

  let progressValue

  // first 60 seconds... up to 50%
  if (elapsed < 60) {
    progressValue = elapsed / (60 * 2) * 100
  }
  // next 60 seconds... up to 75%
  else if (elapsed < 120) {
    progressValue = 50 + (elapsed - 60) / (60 * 4) * 100
  }
  // next 120 seconds... up to 100%
  else if (elapsed < 240) {
    progressValue = 75 + (elapsed - 120) / (120 * 4) * 100
  } else {
    progressValue = 1
  }
  progressValue = Math.floor(progressValue)

  return (
    <Flex maxWidth="260px">
      <Progress value={progressValue} />
    </Flex>
  )
}

const renderChatQueryProgressUpdate = (querySubmittedAt: Date) => {
  const elapsed = (new Date().getTime() - new Date(querySubmittedAt).getTime()) / 1000

  const saraIs = 'Sara is '

  const SaraProgressValues = [
    // First minute: frequent updates (every 15 seconds)
    'analyzing question',
    'searching codebase',
    'retrieving analysis',
    'cross-referencing',

    // Second minute: less frequent updates (every 20 seconds)
    'summarizing findings',
    'updating notes',
    'preparing tasks',
    
    // Third to fourth minute: deep learning mode (every 30 seconds)
    'deep learning',
    'rechecking archives',
    'synthesizing response',
    'completing the response'
  ]

  const secsPerMin = 60
  let saraProgressValue
  if (elapsed < secsPerMin) {
    let index = (elapsed / 15) % 4
    saraProgressValue = SaraProgressValues[Math.floor(index)]
  } else if (elapsed < (2 * secsPerMin)) {
    let index = ((elapsed - secsPerMin) / 20) % 3 + 4
    saraProgressValue = SaraProgressValues[Math.floor(index)]
  } else if (elapsed < (4 * secsPerMin)) {
    let index = ((elapsed - (2 * secsPerMin)) / 30) % 4 + 7
    saraProgressValue = SaraProgressValues[Math.floor(index)]
  } else {
    saraProgressValue = SaraProgressValues[Object.keys(SaraProgressValues).length - 1]
  }

  return (
    <Flex gap="1">
      <Text size="2">
        {saraIs}
      </Text>
      <Text size="2">{saraProgressValue}</Text>
    </Flex>
  )
}

function renderSideChatDetails(
  contentType: 'QUERY' | 'RESPONSE',
  copyToClipboard: (id: string) => void,
  copied: boolean,
  setCopied: React.Dispatch<React.SetStateAction<boolean>>,
  chatAvatarDetails?: ChatAvatarDetails,
  chatQueryStatus?: ChatQueryStatus,
  querySubmittedAt?: Date,
  responseReceivedAt?: Date,
  content?: string,
  showRawStatus?: boolean,
) {
  showRawStatus = false // disable debugging for now
  return (
    <Flex direction="column" maxWidth="280px">
      <Card>
        <Flex direction="column" width="260px" gap="1">
          {/* This is the header row containing the avatar and the clipboard icon */}
          <Flex justify="between" align="center" width="100%">
            {renderAvatar(contentType, chatAvatarDetails)}

            {/* This div is aligned to the right and contains the clipboard icon */}
            {content && contentType === 'RESPONSE' && (
              <Tooltip.Root>
                <Tooltip.Provider>
                  <Tooltip.Trigger
                    className="flex items-center cursor-pointer"
                    onClick={() => copyToClipboard(content)}
                  >
                    <CopyToClipboardIcon copied={copied} color="#6B7280" />
                  </Tooltip.Trigger>
                  <Tooltip.Content
                    side="left"
                    align="end"
                    className="clipboardCopyToolTip"
                  >
                    Copy Response to Clipboard
                  </Tooltip.Content>
                </Tooltip.Provider>
              </Tooltip.Root>
            )}
          </Flex>
          <Flex align="start" gap="1">
            {renderChatQueryStatusIcon(chatQueryStatus)}
            {renderTimestamp(contentType, chatQueryStatus, querySubmittedAt, responseReceivedAt)}
          </Flex>
          <Flex align="center" gap="1">
            {showRawStatus?renderChatQueryStatusText(chatQueryStatus):
            chatQueryStatus === 'QUERY_SUBMITTED' && querySubmittedAt !== undefined?renderChatQueryProgressUpdate(querySubmittedAt):null
            }
          </Flex>
          {chatQueryStatus === 'QUERY_SUBMITTED' && querySubmittedAt
            ? renderChatQueryProgressBar(querySubmittedAt)
            : null}
          {chatQueryStatus === 'QUERY_SUBMITTED' && querySubmittedAt && showRawStatus
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
  const [copied, setCopied] = useState(false)

  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  if (!saraSession) {
    return null
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000) // Reset icon after 2 seconds
      },
      (err) => {
        console.error(
          `${saraSession.email} Failed to copy ID to clipboard:`,
          err,
        )
        setCopied(false)
      },
    )
  }

  const isProduction = process.env.NEXT_PUBLIC_SARA_STAGE?.toLowerCase() === 'prod'

  return (
    <div className={cn('group relative mb-4 flex items-start')} {...props}>
      {renderSideChatDetails(
        contentType,
        copyToClipboard,
        copied,
        setCopied,
        chatAvatarDetails,
        chatQueryStatus,
        querySubmittedAt,
        responseReceivedAt,
        content,
        !isProduction,
      )}
      <div className="flex-1 px-1 ml-4 space-y-2 overflow-auto" style={{ maxWidth: 'calc(100vh)' }}>
      <MemoizedReactMarkdown
        className="markdownDisplay"
        remarkPlugins={[remarkGfm, remarkMath]}
        components={{
            p({ children }: { children: React.ReactNode }) {
            if (contentType === 'QUERY') {
                return <p className="mb-2 last:mb-0 font-semimedium">{children}</p>;
            } else {
                return <p className="mb-2 last:mb-0">{children}</p>;
            }
            },
            code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');

            if (inline) {
                return <code className={className} {...props}>{children}</code>;
            } else {
                // Check if this is a Mermaid code block
                if (match && match[1] === 'mermaid') {
                  return <MermaidWrapper markup={String(children).replace(/\n$/, '')} />;
                } else {
                // Render as regular code block if not Mermaid
                  return <CodeBlock
                    key={Math.random()}
                    language={(match && match[1]) || ''}
                    value={String(children).replace(/\n$/, '')}
                    {...props}
                />;
                }
            }
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
