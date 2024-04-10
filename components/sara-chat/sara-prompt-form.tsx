'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { UseChatHelpers } from 'ai/react'
import { toast } from 'react-hot-toast'
import Textarea from 'react-textarea-autosize'

import { type ProjectHealthStatusValue } from './../../lib/data-model-types'
import { useEnterSubmit } from './../../lib/hooks/use-enter-submit'
import { cn } from './../../lib/utils'
import { Button, buttonVariants } from './../ui/button'
import { IconArrowElbow, IconPlus } from './../ui/icons'
import { Tooltip, TooltipContent, TooltipTrigger } from './../ui/tooltip'

export interface SaraPromptFormProps
  extends Pick<UseChatHelpers, 'input' | 'setInput'> {
  onQuerySubmit: (query: string) => void
  saraConfigured: boolean
  autoPromptClicked?: boolean
  projectHealth: ProjectHealthStatusValue
}

// TODO: Can I just use the isLoading prop? Where does it come from?
const SaraPromptForm = ({
  onQuerySubmit,
  input,
  setInput,
  saraConfigured,
  autoPromptClicked,
  projectHealth,
}: SaraPromptFormProps) => {
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  if (input.trim() && autoPromptClicked && saraConfigured) {
    setInput('')
    onQuerySubmit(input.trim())
  }

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()

        if (projectHealth === 'UNHEALTHY') {
          toast.error('Unable to submit query while project is unhealthy')

          return
        }

        if (!input?.trim()) {
          return
        }

        // If Sara isn't configured yet then return early to prevent
        // submission. Failure to do so could cause 404 errors.
        if (!saraConfigured) {
          return
        }

        setInput('')
        // TODO: Does this need to be async? Original was
        await onQuerySubmit(input)
      }}
      ref={formRef}
    >
      <div className="relative flex flex-col w-full px-8 overflow-hidden max-h-60 grow bg-background sm:rounded-md sm:border sm:px-12">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.preventDefault()
                router.refresh()
                router.push('/')
              }}
              className={cn(
                buttonVariants({ size: 'sm', variant: 'outline' }),
                'absolute left-0 top-4 h-8 w-8 rounded-full bg-background p-0 sm:left-4',
              )}
            >
              <IconPlus />
              <span className="sr-only">New Chat</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Sara anything about your project goal or task..."
          spellCheck={false}
          className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
        />
        <div className="absolute right-0 top-4 sm:right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                disabled={input === '' || !saraConfigured}
              >
                <IconArrowElbow />
                <span className="sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
  )
}

export default SaraPromptForm
