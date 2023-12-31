import { Sidebar } from '@/components/sidebar'

import { auth } from '@/auth'
import { ChatHistory } from '@/components/chat-history'

import TaskDataLoader from './task-data-loader'
// TODO: Some notes for myself
// With regards to the UX for providing a message/request for the first time I
// see that the <Chat>/<ChatPanel> gets updated lots and once the message is
// finished I see the backend compile /chat/[id]. This must be pushed on as a route
// from the callback passed in to 'useChat()' in the <Chat> component


export async function SidebarDesktop() {
  const session = await auth()
  console.log(`<SidebarDesktop> render after auth`)

  if (!session?.user?.id) {
    return null
  }

  return (
    <Sidebar className="peer absolute inset-y-0 z-30 hidden -translate-x-full border-r bg-muted duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px]">
      <div className="flex flex-col h-full">
        {/* @ts-ignore */}
        <TaskDataLoader userId={session.user.id} />
        {/*<ChatHistory userId={session.user.id} />*/}
      </div>
    </Sidebar>
  )
}
