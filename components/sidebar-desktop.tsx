'use client'

import { Sidebar } from '@/components/sidebar'

import { ChatHistory } from '@/components/chat-history'
import { useAppContext } from '@/lib/hooks/app-context'

import { TaskDataLoader } from './task-data-loader'

export function SidebarDesktop() {
  const { selectedActiveTask, selectedRepository } = useAppContext()

  return (
    <Sidebar className="peer absolute inset-y-0 z-30 hidden -translate-x-full border-r bg-muted duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px]">
      <div className="flex flex-col h-full">
        {/* @ts-ignore */}
        <TaskDataLoader repo={selectedRepository} />
        <ChatHistory task={selectedActiveTask} />
      </div>
    </Sidebar>
  )
}
