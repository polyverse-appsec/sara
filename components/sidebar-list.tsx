'use client'

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { Chat, Task, type ServerActionResult } from '../lib/data-model-types'
import { useAppContext } from './..//lib/hooks/app-context'
import { getChats } from './../app/actions'
import { SidebarItems } from './sidebar-items'
import { ThemeToggle } from './theme-toggle'

interface SidebarListProps {
  children?: React.ReactNode
}

export function SidebarList() {
  const [chats, setChats] = useState([] as Chat[])
  const {
    chatStreamLastFinishedAt,
    saraConfig: {
      projectConfig: { project },
    },
  } = useAppContext()
  const router = useRouter()
  const path = usePathname()

  const chatRemovedHandler = (chatIdToRemove: string) => {
    const filteredChats = chats.filter((chat: Chat) => {
      if (chat.id !== chatIdToRemove) {
        return true
      }

      return false
    })

    if (path.includes(`/chat/${chatIdToRemove}`)) {
      router.push('/')
      router.refresh()
    }

    setChats(filteredChats)
  }

  useEffect(() => {
    const fetchChats = async () => {
      if (!project || !project.defaultTask?.id) {
        return
      }

      const loadedChats = await getChats(project.defaultTask.id)
      setChats(loadedChats)
    }

    fetchChats()
  }, [project, chatStreamLastFinishedAt])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        {chats?.length ? (
          <div className="space-y-2 px-2">
            <SidebarItems
              chats={chats}
              chatRemovedHandler={chatRemovedHandler}
            />
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No chat history</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between p-4">
        <ThemeToggle />
      </div>
    </div>
  )
}
