'use client'

import { error } from 'console'
import { ReactElement, ReactNode, useState } from 'react'
import Image from 'next/image'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, Card, Flex, Progress, Text } from '@radix-ui/themes'
import { SaraSession } from 'auth'
import { ChatContentTypeQuery } from 'components/chat/chat-query-content'
import BoltOutlineIcon from 'components/icons/BoltOutlineIcon'
import BoltSolidIcon from 'components/icons/BoltSolidIcon'
import BulbOutlineIcon from 'components/icons/BulbOutlineIcon'
import BulbSolidIcon from 'components/icons/BulbSolidIcon'
import CopyToClipboardIcon from 'components/icons/CopyToClipboardIcon'
import GreenSolidCheckIcon from 'components/icons/GreenSolidCheckIcon'
import HeartOutlineIcon from 'components/icons/HeartOutlineIcon'
import HeartSolidIcon from 'components/icons/HeartSolidIcon'
import RedSolidStopIcon from 'components/icons/RedSolidStopIcon'
import RedSolidXIcon from 'components/icons/RedSolidXIcon'
import XCircleOutlineIcon from 'components/icons/XCircleOutlineIcon'
import XCircleSolidIcon from 'components/icons/XCircleSolidIcon'
import LoadingSpinner from 'components/loading-spinner'
import { type ChatQueryStatus, type FineTuningTags } from 'lib/data-model-types'
import { last } from 'lodash'
import { useSession } from 'next-auth/react'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn, formatDateTimeSinceOperationOccurred } from '../../lib/utils'
import { MemoizedReactMarkdown } from '../markdown'
import { CodeBlock } from '../ui/codeblock'
import { IconUser } from '../ui/icons'
import MermaidWrapper from '../ui/MermaidWrapper'
import Sara32x32 from './../../public/Sara_Cartoon_Portrait-32x32.png'

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
  fineTuningTags: FineTuningTags[]
  onFineTuningTagsModified: (fineTunningTags: FineTuningTags[]) => void
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

const renderQuerySubmittedAt = (querySubmittedAt?: Date) => {
  const timeStr = formatDateTimeSinceOperationOccurred(querySubmittedAt)

  return (
    <Flex gap="1">
      <Text size="2">{'You asked '}</Text>
      <Text size="2">{timeStr}</Text>
    </Flex>
  )
}

const renderLastCheckedAt = (lastCheckedTime?: Date) => {
  const timeStr = formatDateTimeSinceOperationOccurred(lastCheckedTime, false)

  return (
    <Flex gap="1">
      <Text size="2">{'Sara thinking for '}</Text>
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
      <Text size="2">{'Sara answered '} {timeStr}</Text>
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
  const elapsed =
    (new Date().getTime() - new Date(querySubmittedAt).getTime()) / 1000

  let progressValue

  // first 60 seconds... up to 50%
  if (elapsed < 60) {
    progressValue = (elapsed / (60 * 2)) * 100
  }
  // next 60 seconds... up to 75%
  else if (elapsed < 120) {
    progressValue = 50 + ((elapsed - 60) / (60 * 4)) * 100
  }
  // next 120 seconds... up to 100%
  else if (elapsed < 240) {
    progressValue = 75 + ((elapsed - 120) / (120 * 4)) * 100
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
  const elapsed =
    (new Date().getTime() - new Date(querySubmittedAt).getTime()) / 1000

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
    'completing the response',
  ]

  const secsPerMin = 60
  let saraProgressValue
  if (elapsed < secsPerMin) {
    let index = (elapsed / 15) % 4
    saraProgressValue = SaraProgressValues[Math.floor(index)]
  } else if (elapsed < 2 * secsPerMin) {
    let index = (((elapsed - secsPerMin) / 20) % 3) + 4
    saraProgressValue = SaraProgressValues[Math.floor(index)]
  } else if (elapsed < 4 * secsPerMin) {
    let index = (((elapsed - 2 * secsPerMin) / 30) % 4) + 7
    saraProgressValue = SaraProgressValues[Math.floor(index)]
  } else {
    saraProgressValue =
      SaraProgressValues[Object.keys(SaraProgressValues).length - 1]
  }

  return (
    <Flex gap="1">
      <Text size="2">{saraIs}</Text>
      <Text size="2">{saraProgressValue}</Text>
    </Flex>
  )
}

interface FineTuningButtonProps {
  isTaggedChildren: ReactElement
  isUntaggedChildren: ReactElement
  tag: FineTuningTags
  isInitiallyTagged?: boolean
  onFineTuningTagAdded: (fineTunningTag: FineTuningTags) => void
  onFineTuningTagRemoved: (fineTunningTag: FineTuningTags) => void
}

const FineTuningButton = ({
  isTaggedChildren,
  isUntaggedChildren,
  tag,
  isInitiallyTagged,
  onFineTuningTagAdded,
  onFineTuningTagRemoved,
}: FineTuningButtonProps) => {
  const [isTagged, setIsTagged] = useState<boolean>(
    isInitiallyTagged ? isInitiallyTagged : false,
  )

  return (
    <Button
      variant="ghost"
      onClick={() => {
        if (isTagged) {
          setIsTagged(false)
          onFineTuningTagRemoved(tag)
          return
        }

        setIsTagged(true)
        onFineTuningTagAdded(tag)
      }}
    >
      {isTagged ? isTaggedChildren : isUntaggedChildren}
    </Button>
  )
}

interface FineTuningTagsManagerProps {
  onFineTuningTagsModified: (fineTunningTags: FineTuningTags[]) => void
  fineTuningTags: FineTuningTags[]
  tagsToRender: FineTuningTags[]
}

const FineTuningTagsManager = ({
  onFineTuningTagsModified,
  fineTuningTags,
  tagsToRender,
}: FineTuningTagsManagerProps) => {
  const handleFineTuningTagAdded = (fineTuningTag: FineTuningTags) => {
    const newFineTuningTags = [...fineTuningTags]
    newFineTuningTags.push(fineTuningTag)

    onFineTuningTagsModified(newFineTuningTags)
  }

  const handleFineTuningTagRemoved = (fineTuningTag: FineTuningTags) => {
    const newFineTuningTags = [...fineTuningTags].filter(
      (filteredFineTuningTag) => filteredFineTuningTag !== fineTuningTag,
    )

    onFineTuningTagsModified(newFineTuningTags)
  }

  return (
    <Flex direction="column" align="start">
      {tagsToRender.includes('FAVORITE') && (
        <FineTuningButton
          tag="FAVORITE"
          isInitiallyTagged={fineTuningTags?.includes('FAVORITE') === true}
          onFineTuningTagAdded={handleFineTuningTagAdded}
          onFineTuningTagRemoved={handleFineTuningTagRemoved}
          isTaggedChildren={
            <>
              <HeartSolidIcon /> Favorite
            </>
          }
          isUntaggedChildren={
            <>
              <HeartOutlineIcon /> Favorite
            </>
          }
        />
      )}
      {tagsToRender.includes('INSIGHTFUL') && (
        <FineTuningButton
          tag="INSIGHTFUL"
          isInitiallyTagged={fineTuningTags?.includes('INSIGHTFUL') === true}
          onFineTuningTagAdded={handleFineTuningTagAdded}
          onFineTuningTagRemoved={handleFineTuningTagRemoved}
          isTaggedChildren={
            <>
              <BulbSolidIcon /> Insightful
            </>
          }
          isUntaggedChildren={
            <>
              <BulbOutlineIcon /> Insightful
            </>
          }
        />
      )}
      {tagsToRender.includes('PRODUCTIVE') && (
        <FineTuningButton
          tag="PRODUCTIVE"
          isInitiallyTagged={fineTuningTags?.includes('PRODUCTIVE') === true}
          onFineTuningTagAdded={handleFineTuningTagAdded}
          onFineTuningTagRemoved={handleFineTuningTagRemoved}
          isTaggedChildren={
            <>
              <BoltSolidIcon /> Productive
            </>
          }
          isUntaggedChildren={
            <>
              <BoltOutlineIcon /> Productive
            </>
          }
        />
      )}
      {tagsToRender.includes('UNHELPFUL') && (
        <FineTuningButton
          tag="UNHELPFUL"
          isInitiallyTagged={fineTuningTags?.includes('UNHELPFUL') === true}
          onFineTuningTagAdded={handleFineTuningTagAdded}
          onFineTuningTagRemoved={handleFineTuningTagRemoved}
          isTaggedChildren={
            <>
              <XCircleSolidIcon /> Unhelpful
            </>
          }
          isUntaggedChildren={
            <>
              <XCircleOutlineIcon /> Unhelpful
            </>
          }
        />
      )}
    </Flex>
  )
}

function renderSideChatDetails(
  content: string,
  contentType: 'QUERY' | 'RESPONSE',
  copyToClipboard: (id: string) => void,
  copied: boolean,
  fineTuningTags: FineTuningTags[],
  onFineTuningTagsModified: (fineTunningTags: FineTuningTags[]) => void,
  chatAvatarDetails?: ChatAvatarDetails,
  chatQueryStatus?: ChatQueryStatus,
  querySubmittedAt?: Date,
  responseReceivedAt?: Date,
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
            {renderTimestamp(
              contentType,
              chatQueryStatus,
              querySubmittedAt,
              responseReceivedAt,
            )}
          </Flex>
          <Flex align="center" gap="1">
            {showRawStatus
              ? renderChatQueryStatusText(chatQueryStatus)
              : chatQueryStatus === 'QUERY_SUBMITTED' &&
                  querySubmittedAt !== undefined
                ? renderChatQueryProgressUpdate(querySubmittedAt)
                : null}
          </Flex>
          {chatQueryStatus === 'QUERY_SUBMITTED' && querySubmittedAt
            ? renderChatQueryProgressBar(querySubmittedAt)
            : null}
          {chatQueryStatus === 'QUERY_SUBMITTED' &&
          querySubmittedAt &&
          showRawStatus
            ? renderChatQueryProgressUpdate(querySubmittedAt)
            : null}
          {contentType === 'QUERY' && (
            <FineTuningTagsManager
              onFineTuningTagsModified={onFineTuningTagsModified}
              fineTuningTags={fineTuningTags}
              tagsToRender={['FAVORITE']}
            />
          )}
          {contentType === 'RESPONSE' && (
            <FineTuningTagsManager
              onFineTuningTagsModified={onFineTuningTagsModified}
              fineTuningTags={fineTuningTags}
              tagsToRender={['INSIGHTFUL', 'PRODUCTIVE', 'UNHELPFUL']}
            />
          )}
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
  fineTuningTags,
  onFineTuningTagsModified,
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

  const isProduction =
    process.env.NEXT_PUBLIC_SARA_STAGE?.toLowerCase() === 'prod'

  return (
    <div className={cn('group relative mb-4 flex items-start')} {...props}>
      {renderSideChatDetails(
        content,
        contentType,
        copyToClipboard,
        copied,
        fineTuningTags,
        onFineTuningTagsModified,
        chatAvatarDetails,
        chatQueryStatus,
        querySubmittedAt,
        responseReceivedAt,
        !isProduction,
      )}
      <div
        className="flex-1 px-1 ml-4 space-y-2 overflow-auto"
        style={{ maxWidth: 'calc(100vh)' }}
      >
        <MemoizedReactMarkdown
          className="markdownDisplay"
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }: { children: React.ReactNode }) {
              if (contentType === 'QUERY') {
                return (
                  <p className="mb-2 last:mb-0 font-semimedium">{children}</p>
                )
              } else {
                return <p className="mb-2 last:mb-0">{children}</p>
              }
            },
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '')

              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              } else {
                // Check if this is a Mermaid code block
                if (match && match[1] === 'mermaid') {
                  return (
                    <MermaidWrapper
                      markup={String(children).replace(/\n$/, '')}
                    />
                  )
                } else {
                  // Render as regular code block if not Mermaid
                  return (
                    <CodeBlock
                      key={Math.random()}
                      language={(match && match[1]) || ''}
                      value={String(children).replace(/\n$/, '')}
                      {...props}
                    />
                  )
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
