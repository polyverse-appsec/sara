'use client'

import * as React from 'react'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
// TODO: Do I need to use this package at all?
import { type UseChatHelpers } from 'ai/react'
import { toast } from 'react-hot-toast'

import {
  type ChatQueryPartDeux,
  type ProjectHealthStatusValue,
} from './../../lib/data-model-types'
import { Button } from './..//ui/button'
import { ButtonScrollToBottom } from './../button-scroll-to-bottom'
import { IconRefresh, IconStop } from './../ui/icons'
import SaraPromptForm from './sara-prompt-form'

export interface SaraChatPanelProps
  extends Pick<UseChatHelpers, 'input' | 'setInput'> {
  id?: string
  title?: string
  chatQueries: ChatQueryPartDeux[]
  onQuerySubmit: (query: string) => void
  projectHealth: ProjectHealthStatusValue
}

const renderChatAlert = (projectHealth: ProjectHealthStatusValue) => {
  if (projectHealth === 'UNHEALTHY') {
    return (
      <>
        <ExclamationTriangleIcon className="text-red-500" />
        Project Unhealthy - Sara is attempting a fix
      </>
    )
  }

  if (projectHealth === 'PARTIALLY_HEALTHY') {
    return (
      <>
        <ExclamationTriangleIcon className="text-yellow-500" />
        Sara is still Deep Learning - Your Results Will Improve Over Time
      </>
    )
  }

  return null
}

// TODO: Add to this the little fly overs that tell users to configure whatever akin to how it shows stop message/regenerate message
const SaraChatPanel = ({
  input,
  setInput,
  chatQueries,
  onQuerySubmit,
  projectHealth,
}: SaraChatPanelProps) => {
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)

  // TODO: Cut the stop generating and regenerate response buttons/icons for now
  // {true ? (
  //   <Button
  //     variant="outline"
  //     onClick={() => {
  //       // Used to be stop() here
  //       console.log(
  //         `****** onClick invoked for Button to stop generation`,
  //       )
  //     }}
  //     className="bg-background"
  //   >
  //     <IconStop className="mr-2" />
  //     Stop generating
  //   </Button>
  // ) : (
  //   chatQueries.length > 0 && (
  //     <div className="flex space-x-2">
  //       <Button
  //         variant="outline"
  //         onClick={() => {
  //           // Used to be reload() here
  //           console.log(
  //             `****** onClick invoked for Button to regenerate response`,
  //           )
  //         }}
  //       >
  //         <IconRefresh className="mr-2" />
  //         Regenerate response
  //       </Button>
  //     </div>
  //   )
  // )}

  return (
    <div className="fixed inset-x-0 bottom-[75px] w-full bg-gradient-to-b from-[var(--chat-panel-bg-start)] to-[var(--chat-panel-bg-end)] animate-in duration-300 ease-in-out peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
      <ButtonScrollToBottom />
      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="flex items-center justify-center h-12">
          {renderChatAlert(projectHealth)}
        </div>
        <div className="px-4 py-2 space-y-4 border-t shadow-lg bg-background sm:rounded-xl sm:border md:py-4">
          <SaraPromptForm
            projectHealth={projectHealth}
            onQuerySubmit={async (query) => {
              // Check that the last chat query has received a response or
              // isn't in an error state in order to allow a query to take place
              if (chatQueries.length > 0) {
                const lastChatQuery = chatQueries[chatQueries.length - 1]

                if (lastChatQuery.status === 'ERROR') {
                  toast.error(
                    'Unable to submit new chat query - previous chat query in error state',
                  )
                  return
                }

                if (lastChatQuery.status !== 'RESPONSE_RECEIVED') {
                  toast.custom(
                    'Unable to submit new chat query - previous chat query in error state',
                  )
                  return
                }
              }

              // We used to append() here
              console.log(`***** onSubmit invoked on <PromptForm>`)
              onQuerySubmit(query)
            }}
            input={input}
            setInput={setInput}
            saraConfigured={true}
          />
        </div>
      </div>
    </div>
  )
}

export default SaraChatPanel
