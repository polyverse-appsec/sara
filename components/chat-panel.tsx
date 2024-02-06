import * as React from 'react'
import { type UseChatHelpers } from 'ai/react'

import { ButtonScrollToBottom } from './button-scroll-to-bottom'
import { ChatFooter } from './chat-footer'
import { PromptForm } from './prompt-form'
import { Button } from './ui/button'
import { IconRefresh, IconShare, IconStop } from './ui/icons'

export interface ChatPanelProps
  extends Pick<
    UseChatHelpers,
    | 'append'
    | 'isLoading'
    | 'reload'
    | 'messages'
    | 'stop'
    | 'input'
    | 'setInput'
  > {
  id?: string
  title?: string
  saraConfigured: boolean
}

// TODO: Add to this the little fly overs that tell users to configure whatever akin to how it shows stop message/regenerate message
export function ChatPanel({
  id,
  title,
  isLoading,
  stop,
  append,
  reload,
  input,
  setInput,
  messages,
  saraConfigured,
}: ChatPanelProps) {
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)

  return (
    <div className="fixed inset-x-0 bottom-[75px] w-full bg-gradient-to-b from-muted/30 from-0% to-muted/30 to-50% animate-in duration-300 ease-in-out dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
      <ButtonScrollToBottom />
      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="flex items-center justify-center h-12">
          {isLoading ? (
            <Button
              variant="outline"
              onClick={() => stop()}
              className="bg-background"
            >
              <IconStop className="mr-2" />
              Stop generating
            </Button>
          ) : (
            messages?.length >= 2 && (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => reload()}>
                  <IconRefresh className="mr-2" />
                  Regenerate response
                </Button>
              </div>
            )
          )}
        </div>
        <div className="px-4 py-2 space-y-4 border-t shadow-lg bg-background sm:rounded-t-xl sm:border md:py-4">
          <PromptForm
            onSubmit={async (value) => {
              // TODO: Write to console onSubmit time
              // TODO: Surround append in try/catch
              // TODO: Log out any caught error
              // TODO: Write to console onSubmit finish time or error time
              // Append a new chat message triggering an API call to our
              // endpoint passing in an ID, the content of the form for the
              // message and a role as user.
              await append({
                id,
                content: value,
                role: 'user',
              })
            }}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            saraConfigured={saraConfigured}
          />
          <ChatFooter className="hidden sm:block" />
        </div>
      </div>
    </div>
  )
}
