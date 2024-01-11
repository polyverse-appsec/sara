'use client'

import { useChat, type Message } from 'ai/react'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'react-hot-toast'
import { usePathname, useRouter } from 'next/navigation'
import { useAppContext } from '@/lib/hooks/app-context'
import { Chat, Project, Task } from '@/lib/dataModelTypes'
import { getRepositoryFromId, getOrganizations, getTask } from '@/app/actions'

const IS_PREVIEW = process.env.VERCEL_ENV === 'preview'
export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  chat: Chat
}

export function Chat({ chat, initialMessages, className }: ChatProps) {
  const router = useRouter()
  const path = usePathname()
  const [previewToken, setPreviewToken] = useLocalStorage<string | null>(
    'ai-token',
    null
  )
  const [previewTokenDialog, setPreviewTokenDialog] = useState(IS_PREVIEW)
  const [previewTokenInput, setPreviewTokenInput] = useState(previewToken ?? '')

  const {
    selectedActiveChat,
    setSelectedActiveChat,
    selectedProject: selectedRepository,
    setSelectedProject: setSelectedRepository,
    selectedActiveTask,
    setSelectedActiveTask,
    setSelectedOrganization,
    setTasksLastGeneratedAt
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
      body: {
        id: chat.id,
        previewToken,
        repo: selectedRepository,
        task: selectedActiveTask,
        chat: selectedActiveChat
      },
      onResponse(response) {
        if (response.status === 401) {
          toast.error(response.statusText)
        }
      },
      onFinish() {
        // The 'onFinish()' callback gets called after the chat stream ends
        if (!path.includes('chat')) {
          //original template code, fixing it for local deployment (there is no
          //shallow option in next.js)
          //router.push(`/chat/${id}`, { shallow: true, scroll: false })
          console.log(
            `chat.tsx: router.push and doing redirect to chat/${chat.id}`
          )
          router.push(`/chat/${chat.id}`, { scroll: false })
          router.refresh()
        }

        // Regardless of if tasks have actually been generated as a result of
        // this chat update the app context from when this chat finished in
        // the event tasks were generated. If so then any React components
        // that require knowing when new tasks have been generated will
        // re-render and query for those tasks.
        setTasksLastGeneratedAt(Date.now())
      }
    })

  useEffect(() => {
    async function checkChat() {
      //chats can be reached by direct deep links (e.g. /chat/1234)
      //so we need to see if our appContext has been set and matches.
      //if it's different than the chat that has come in through props, reset the appContext to match
      //the chat that has come in.
      // the chatId, repoId, and taskId must all match the ids in the chat prop
      //, otherwise we need to reset the appContext
      if (!chat.taskId || !chat.repoId) {
        //this is an old chat made before the 1/4/24 update.  just log the error for now, it can
        //be fixed by just adding more content to the chat.
        console.log(
          'chat.tsx: chat is missing taskId or repoId. Fix this by asking another question to the chat with the repo set, and the chat will be updated'
        )
        return
      }
      //now we see if the chat matches the appContext selectedRepository and selectedActiveTask
      //if it doesn't, we need to reset the appContext
      if (
        chat.taskId !== selectedActiveTask?.id ||
        chat.repoId !== selectedRepository?.full_name
      ) {
        //reset the appContext to match the chat
        console.log('chat.tsx: resetting appContext to match chat')
        const task = await getTask(chat.taskId, chat.userId)
        const repo = await getRepositoryFromId(chat.repoId, chat.userId)
        //we don't store organizations, fetch the user orgs and filter by org.login to match
        //the repo.orgId
        const orgs = await getOrganizations()
        const org = orgs.filter(org => org.login == repo?.orgId)[0]
        setSelectedOrganization(org)
        setSelectedRepository(repo)
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
    selectedRepository,
    setSelectedRepository,
    setSelectedOrganization
  ])

  return (
    <>
      <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
        {messages.length ? (
          <>
            <ChatList messages={messages} />
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

      <Dialog open={previewTokenDialog} onOpenChange={setPreviewTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter your OpenAI Key</DialogTitle>
            <DialogDescription>
              If you have not obtained your OpenAI API key, you can do so by{' '}
              <a
                href="https://platform.openai.com/signup/"
                className="underline"
              >
                signing up
              </a>{' '}
              on the OpenAI website. This is only necessary for preview
              environments so that the open source community can test the app.
              The token will be saved to your browser&apos;s local storage under
              the name <code className="font-mono">ai-token</code>.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={previewTokenInput}
            placeholder="OpenAI API key"
            onChange={e => setPreviewTokenInput(e.target.value)}
          />
          <DialogFooter className="items-center">
            <Button
              onClick={() => {
                setPreviewToken(previewTokenInput)
                setPreviewTokenDialog(false)
              }}
            >
              Save Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
