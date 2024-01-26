'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useChat, type Message } from 'ai/react'
import { toast } from 'react-hot-toast'

import type { Chat } from '@/lib/dataModelTypes'
import { useAppContext } from '@/lib/hooks/app-context'
import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import { EmptyScreen } from '@/components/empty-screen'
import { getOrganizations, getProject, getTask } from '@/app/actions'

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
  } = useAppContext()

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
        project: selectedProject,
        chat: selectedActiveChat,
        task: selectedActiveTask,
      },
      onResponse(response) {
        const { status, statusText } = response

        if (status === 400 || status === 401) {
          toast.error(statusText)
        }
      },
      onFinish() {
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
        console.error('Chat encountered an error:', error);
      },
    })

  useEffect(() => {
    async function checkChat() {
      //chats can be reached by direct deep links (e.g. /chat/1234)
      //so we need to see if our appContext has been set and matches.
      //if it's different than the chat that has come in through props, reset the appContext to match
      //the chat that has come in.
      // the chatId, repoId, and taskId must all match the ids in the chat prop
      //, otherwise we need to reset the appContext
      if (!chat.taskId || !chat.projectId) {
        //this is an old chat made before the 1/4/24 update.  just log the error for now, it can
        //be fixed by just adding more content to the chat.
        console.log(
          'chat.tsx: chat is missing taskId or repoId. Fix this by asking another question to the chat with the repo set, and the chat will be updated',
        )
        return
      }
      //now we see if the chat matches the appContext selectedRepository and selectedActiveTask
      //if it doesn't, we need to reset the appContext
      if (
        chat.taskId !== selectedActiveTask?.id ||
        chat.projectId !== selectedProject?.id
      ) {
        //reset the appContext to match the chat
        const task = await getTask(chat.taskId, chat.userId)
        const project = await getProject(chat.projectId)
        //we don't store organizations, fetch the user orgs and filter by org.login to match
        //the repo.orgId
        const orgs = await getOrganizations()
        const org = orgs.filter((org) => org.login == project?.orgId)[0]
        setSelectedOrganization(org)
        setSelectedProject(project)
        setSelectedActiveTask(task)
        setSelectedActiveChat(chat)
      }
    }
    checkChat()
  }, [
    chat,
    selectedActiveChat,
    setSelectedActiveChat,
    selectedActiveTask,
    setSelectedActiveTask,
    setSelectedOrganization,
    selectedProject,
    setSelectedProject,
  ])

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
      />
    </>
  )
}
