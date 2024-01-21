'use client'

import { AnimatePresence, motion } from 'framer-motion'

import { type Chat } from '@/lib/dataModelTypes'
import { SidebarActions } from '@/components/sidebar-actions'
import { SidebarItem } from '@/components/sidebar-item'

interface SidebarItemsProps {
  chats?: Chat[]
  chatRemovedHandler: (chatIdToRemove: string) => void
}

export function SidebarItems({ chats, chatRemovedHandler }: SidebarItemsProps) {
  if (!chats?.length) return null

  return (
    <AnimatePresence>
      {chats.map(
        (chat, index) =>
          chat && (
            <motion.div
              key={chat?.id}
              exit={{
                opacity: 0,
                height: 0,
              }}
            >
              <SidebarItem index={index} chat={chat}>
                <SidebarActions chat={chat} chatRemovedHandler={chatRemovedHandler} />
              </SidebarItem>
            </motion.div>
          ),
      )}
    </AnimatePresence>
  )
}
