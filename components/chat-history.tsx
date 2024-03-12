import * as React from 'react'
import Link from 'next/link'

import { Task } from '../lib/data-model-types'
import { cn } from './../lib/utils'
import { SidebarList } from './sidebar-list'
import { buttonVariants } from './ui/button'
import { IconPlus } from './ui/icons'

interface ChatHistoryProps {
  task: Task | null
}

export function ChatHistory() {
  return (
    <div className="flex flex-col h-full">
      <h1 className="px-4 py-2 text-xl font-bold text-center text-muted-foreground">
        Chats for Selected Task
      </h1>
      <div className="px-2 my-4">
        <Link
          href="/chat"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-10 w-full justify-start bg-zinc-50 px-4 shadow-none transition-colors hover:bg-zinc-200/40 dark:bg-zinc-900 dark:hover:bg-zinc-300/10',
          )}
        >
          <IconPlus className="-translate-x-2 stroke-2" />
          New Chat
        </Link>
      </div>
      {/* @ts-ignore */}
      <SidebarList />
    </div>
  )
}
