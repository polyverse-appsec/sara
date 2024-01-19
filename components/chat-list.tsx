import { type Message } from 'ai'

import { Separator } from '@/components/ui/separator'
import { ChatMessage } from '@/components/chat-message'

export interface ChatList {
  messages: Message[]

  /**
   * Indicates whether we are currently in the midst of a chat with OpenAI.
   */
  isLoading: boolean
}

export function ChatList({ messages, isLoading }: ChatList) {
  if (!messages.length) {
    return null
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {messages.map((message, index) => {
        // We check to see if we ought to render the loading spinner by
        // obviously checking if we are loading but we also need to check to see
        // if we are rendering the last chat message with a role of assistant.
        // If we don't check the index we will render the spinner for every
        // other <ChatMessage>
        const shouldRenderLoadingSpinner =
          isLoading &&
          index + 1 === messages.length &&
          message.role === 'assistant'

        return (
          <div key={index}>
            <ChatMessage
              message={message}
              renderLoadingSpinner={shouldRenderLoadingSpinner}
            />
            {index < messages.length - 1 && (
              <Separator className="my-4 md:my-8" />
            )}
          </div>
        )
      })}
    </div>
  )
}
