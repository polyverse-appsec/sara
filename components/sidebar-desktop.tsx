import { Sidebar } from '@/components/sidebar'

import { auth } from '@/auth'
import { ChatHistory } from '@/components/chat-history'

import {TaskDataLoader} from './task-data-loader'

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
        {<ChatHistory userId={session.user.id} />}
      </div>
    </Sidebar>
  )
}
