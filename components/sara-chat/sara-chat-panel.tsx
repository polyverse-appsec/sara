'use client'

import * as React from 'react'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { type UseChatHelpers } from 'ai/react'

import {
  type ProjectHealthStatusValue,
} from './../../lib/data-model-types'
import { ButtonScrollToBottom } from './../button-scroll-to-bottom'
import { IconRefresh, IconStop } from './../ui/icons'
import SaraPromptForm from './sara-prompt-form'

export interface SaraChatPanelProps
  extends Pick<UseChatHelpers, 'input' | 'setInput'> {
  id?: string
  title?: string
  autoPromptClicked?: boolean
  onQuerySubmit: (query: string) => void
  projectHealth: ProjectHealthStatusValue
}

const renderChatAlert = (projectHealth: ProjectHealthStatusValue) => {
  if (projectHealth === 'UNHEALTHY') {
    return (
      <div className="flex items-center py-1 px-2 bg-gray-400 bg-opacity-50/50 rounded-lg">
        <ExclamationTriangleIcon className="mr-2 text-red-500" />
        Project Unhealthy - Sara is attempting a fix
      </div>
    )
  }

  if (projectHealth === 'PARTIALLY_HEALTHY') {
    return (
      <div className="flex items-center py-1 px-2 bg-gray-400 bg-opacity-50/50 rounded-lg">
        <ExclamationTriangleIcon className="mr-2 text-yellow-500" />
        Sara is still Deep Learning - You May Ask Questions But Note Results
        Will Improve Over Time
      </div>
    )
  }

  return null
}

// TODO: Add to this the little fly overs that tell users to configure whatever akin to how it shows stop message/regenerate message
const SaraChatPanel = ({
  input,
  setInput,
  autoPromptClicked,
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

  const alertContent = renderChatAlert(projectHealth)

  return (
    <div className="fixed bottom-[15px] left-[250px] right-0  animate-in duration-300 ease-in-out">
      <ButtonScrollToBottom />
      <div className="mx-40">
        {alertContent && (
          <div className="flex items-center justify-center h-12">
            {alertContent}
          </div>
        )}
        <div className="px-4 py-2 space-y-4 border-t shadow-lg bg-background sm:rounded-xl sm:border md:py-4">
          <SaraPromptForm
            projectHealth={projectHealth}
            onQuerySubmit={async (query) => {
              onQuerySubmit(query)
            }}
            input={input}
            setInput={setInput}
            autoPromptClicked={autoPromptClicked}
            saraConfigured={true}
          />
        </div>
      </div>
    </div>
  )
}

export default SaraChatPanel
