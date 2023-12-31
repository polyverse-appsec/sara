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

  // TODO: Some notes on how <ChatHistory> works
  // It Renders:
  // <Link> that goes to "/" for a New Chat
  // <React.Suspense> that ultimately renders the <SidebarList>
  //   <SidebarList> starts by 'loadChats' with an await (must be why there is a fallback in the <React.Suspense> parents)
  //   <SidebarList> then renders the loaded chats as <SidebarItems>
  //   <SidebarList> also contains <ThemeToggle> and <ClearHistory> components

  // TODO: 12/30 5:55AM - Had tree rendering with a <TaskTree /> component with mock data before trying to fetch it and moving to <TaskDataLoader>
  // TODO: 12/30 12:45PM - After rebasing from main with some changes from Alex I can't render ChatHistory with my TaskDataLoader and have both show up - hmmmm... why is that?
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
