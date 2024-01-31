'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useChat, type Message } from 'ai/react'
import { toast } from 'react-hot-toast'

import type { Chat } from '../lib/data-model-types'
import { getOrganizations, getProject, getTask } from './../app/actions'
import { useAppContext } from './../lib/hooks/app-context'
import { cn } from './../lib/utils'
import { ChatList } from './chat-list'
import { ChatPanel } from './chat-panel'
import { ChatScrollAnchor } from './chat-scroll-anchor'
import { EmptyScreen } from './empty-screen'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  chat: Chat
}

// Default to an empty list of `initialMessages` if this prop wasn't passed.
// This matches the specification of the `useChat` API from Vercel.
export function Chat({ chat, initialMessages = [], className }: ChatProps) {
  const router = useRouter()
  const path = usePathname()

  const {
    selectedActiveChat,
    setSelectedActiveChat,
    selectedProject,
    setSelectedProject,
    selectedActiveTask,
    setSelectedActiveTask,
    setSelectedOrganization,
    setChatStreamLastFinishedAt,
    saraConfig,
  } = useAppContext()

  // TODO: Need to update the body of useChat with the info in the configured Sara object

  const {
    status,
    projectConfig: {
      project,
      status: projectStatus,
      statusInfo: projectStatusInfo,
    },
  } = saraConfig

  // 'useChat' comes from the Vercel API: https://sdk.vercel.ai/docs/api-reference/use-chat
  //
  // After a message is submitted the 'useChat' hook will automatically append a
  // user message to the chat history and trigger an API call to the configured
  // endpoint.
  //
  // The response will be streamd to the chat history and returned by the hook
  // as messages. Whenver a new chunk of streamed messages is received the hook
  // will automatically update the messages state and trigger a re-render.
  //
  // This enables a seamless chat experience where the user can see the AI
  // response as soon as it is available without having to wait for the entire
  // response.
  //
  // By default 'useChat()' will send API requests to '/api/chat'
  //
  // 'append()' takes a message and appends it to chat, triggering an API call.
  // It returns a promise that resolves to a full response message content when
  // the API call is successfully finished or throws an error.
  const { messages, append, reload, stop, isLoading, input, setInput } =
    useChat({
      initialMessages,
      id: chat.id,
      // `body` is an optional extra body passed to our API endpoint in
      // additional to the `messages` array.
      body: {
        id: chat.id,
        project,
        // TODO: Need to update the body of useChat with the info in the configured Sara object.
        // See <gitHubSelect> for what selectedActiveTask is
        task: selectedActiveTask,
      },
      onResponse(response) {
        const { status, statusText } = response

        console.log(
          `***** onResponse status: ${status} - statusText: ${statusText}`,
        )

        if (status === 400 || status === 401) {
          toast.error(statusText)
        }
      },
      onFinish() {
        console.log(`***** onFinish path: ${path}`)

        // The 'onFinish()' callback gets called after the chat stream ends
        if (!path.includes('chat')) {
          router.push(`/chat/${chat.id}`, { scroll: false })
          router.refresh()
        }

        // Notify those watching the app context for when the chat stream has
        // ended. This is useful for components that aren't showing the same
        // chat stream but rather those that display tangential info surrounding
        // the chats that could change from time to time (e.g. chat and task
        // sidebars)
        setChatStreamLastFinishedAt(Date.now())
      },
      onError(error) {
        console.log(`***** onError path: ${error}`)
        console.error('Chat encountered an error:', error)
      },
    })

  // If this path was navigated it through a path that includes /chat and we
  // haven't yet configured Sara then redirect to the home path so that the user
  // has to configure her by selecting an organization and a repository. Failure
  // to do so will mean that the chat functionality is non-functional and could
  // result in errors.
  if (path.includes('chat') && status !== 'CONFIGURED') {
    router.push('/')
    router.refresh()
    return
  }

  return (
    <>
      <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
        {messages.length ? (
          <>
            <ChatList messages={messages} isLoading={isLoading} />
            <ChatScrollAnchor trackVisibility={isLoading} />
          </>
        ) : (
          <EmptyScreen setInput={setInput} />
        )}
      </div>
      <ChatPanel
        id={chat.id}
        isLoading={isLoading}
        stop={stop}
        append={append}
        reload={reload}
        messages={messages}
        input={input}
        setInput={setInput}
        saraConfigured={
          projectStatus === 'CONFIGURED' &&
          projectStatusInfo === 'Sara Configured For Project'
        }
      />
    </>
  )
}
