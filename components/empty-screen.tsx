import Image from 'next/image'
import { UseChatHelpers } from 'ai/react'

import { Button } from './ui/button'
import { IconArrowRight } from './ui/icons'

const exampleMessages = [
  {
    heading: 'Give me an overview of my project',
    message: `What is the purpose of this project, and what are the main components?`,
  },
  {
    heading: 'Generate tasks for testing',
    message: 'What are some ways I can test this application in the context of my project? Generate your answers as tasks.',
  },
  {
    heading: 'Check to see if security standards are met',
    message: `Are there any security vulnerabilities in my project code? If so, what are they?`,
  },
]

export interface EmptyScreenProps
  extends Pick<UseChatHelpers, 
    | 'append' 
    | 'setInput'
    > {
      id?: string
    }

export function EmptyScreen({ id, setInput, append }: EmptyScreenProps) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <div className="flex items-center mb-2">
          {' '}
          {/* Use flex and items-center for alignment */}
          <Image
            src="/Sara_Cartoon_Portrait.png" // Adjust the path to your image
            alt="Sara's Portrait"
            width={100} // Adjust the width as needed
            height={100} // Adjust the height as needed
          />
          <h1 className="mb-2 text-lg font-semibold ml-2">
            {' '}
            {/* Add margin-left as needed */}
            Hi, my name is Sara!
          </h1>
        </div>

        <p className="mb-2 leading-normal text-muted-foreground">
          I&apos;m a <b>s</b>mart <b>a</b>rchitectural <b>r</b>easoning <b>a</b>
          ssistant powered by AI. I understand your entire software project and
          can help you build and maintain it faster.
        </p>
        <p className="leading-normal text-muted-foreground">
          You can start a conversation in the text box below or try the
          following examples:
        </p>
        <div className="mt-4 flex flex-col items-start space-y-2">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              //onClick={() => setInput(message.message)}
              onClick={async () => 
                await append({
                  id,
                  content: message.message,
                  role: 'user',
                })
              }
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
