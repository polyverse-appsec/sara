'use client'
import React, { useState, useEffect } from 'react'
import { clearChats, getChats } from '@/app/actions'
import { ClearHistory } from '@/components/clear-history'
import { SidebarItems } from '@/components/sidebar-items'
import { ThemeToggle } from '@/components/theme-toggle'
import { Task, Chat } from '@/lib/types'
import { useAppContext } from '@/lib/hooks/app-context'

interface SidebarListProps {
  task: Task | null
  children?: React.ReactNode
}

export function SidebarList({ task }: SidebarListProps) {
  const [chats, setChats] = useState([] as Chat[])
  const { selectedActiveTask } = useAppContext()

  useEffect(() => {
    const fetchChats = async () => {
      const loadedChats = await getChats(selectedActiveTask?.id || null)
      console.log('loadedChats', loadedChats)
      setChats(loadedChats)
    }

    fetchChats()
  }, [selectedActiveTask])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        {chats?.length ? (
          <div className="space-y-2 px-2">
            <SidebarItems chats={chats} />
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No chat history</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between p-4">
        <ThemeToggle />
        <ClearHistory clearChats={clearChats} isEnabled={chats?.length > 0} />
      </div>
    </div>
  )
}
