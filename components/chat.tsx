'use client'

import { usePathname, useRouter } from 'next/navigation'
import { CreateMessage } from 'ai'
import { useChat, type Message } from 'ai/react'
import { toast } from 'react-hot-toast'

import type { Chat } from '../lib/data-model-types'
import { configAssistantForProject } from './../app/_actions/config-assistant-for-project'
import { getFileInfoForProject } from './../app/_actions/get-file-info-for-repo'
import { useAppContext } from './../lib/hooks/app-context'
import { cn, formatDateForLastSynchronizedAt } from './../lib/utils'
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
    setChatStreamLastFinishedAt,
    saraConfig,
    setProjectConfig,
    user,
    setOrgConfig,
  } = useAppContext()

  const {
    projectConfig,
    repoConfig: { repo },
    orgConfig: { organization },
  } = saraConfig

  const {
    project,
    status: projectStatus,
    statusInfo: projectStatusInfo,
  } = projectConfig

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
        task: project?.defaultTask,
      },
      onResponse(response) {
        const { status, statusText } = response

        if (status === 400 || status === 401) {
          toast.error(statusText)
        }
      },
      onFinish(message) {
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
        console.error('Chat encountered an error:', error)
      },
    })

  // If this path was navigated it through a path that includes /chat and we
  // haven't yet configured Sara then redirect to the home path so that the user
  // has to configure her by selecting an organization and a repository. Failure
  // to do so will mean that the chat functionality is non-functional and could
  // result in errors.
  if (path.includes('chat') && projectStatus !== 'CONFIGURED') {
    router.push('/')
    router.refresh()
    return
  }

  const updateAssistantAndAppend = async (
    message: Message | CreateMessage,
  ): Promise<string | null | undefined> => {
    try {
      if (project && project.id && repo && user && organization) {
        const fileInfos = await getFileInfoForProject(project.name, repo, user)
        const assistant = await configAssistantForProject(
          project,
          fileInfos,
          user,
          organization,
        )

        const lastSynchronizedAt = new Date()

        projectConfig.project = project
        projectConfig.project.lastSynchronizedAt = lastSynchronizedAt
        projectConfig.project.assistant = assistant
        projectConfig.status = 'CONFIGURED'
        projectConfig.statusInfo = `Synchronized Last: ${formatDateForLastSynchronizedAt(
          lastSynchronizedAt,
        )}`
        projectConfig.errorInfo = null

        setProjectConfig(projectConfig)
      }
    } catch (err) {
      // We just log here and don't block the chat request from being processed
      // (i.e. return)
      console.debug(
        `Failed to sync the assistant when chat initiated because: ${err}`,
      )
    }

    return append(message)
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
          <EmptyScreen
            id={chat.id}
            append={updateAssistantAndAppend}
            setInput={setInput}
          />
        )}
      </div>
      <ChatPanel
        id={chat.id}
        isLoading={isLoading}
        stop={stop}
        append={updateAssistantAndAppend}
        reload={reload}
        messages={messages}
        input={input}
        setInput={setInput}
        saraConfigured={
          projectStatus === 'CONFIGURED' &&
          projectStatusInfo !== null &&
          projectStatusInfo.includes('Synchronized Last')
        }
      />
    </>
  )
}
