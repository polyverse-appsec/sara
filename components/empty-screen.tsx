import Image from 'next/image'
import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { IconArrowRight } from '@/components/ui/icons'
import { ExternalLink } from '@/components/external-link'

const exampleMessages = [
  {
    heading: 'Please explain how a feature in this project works',
    message: `What is a "serverless function"?`,
  },
  {
    heading: 'Write new code following a specification',
    message: 'Write a function that returns the sum of two numbers',
  },
  {
    heading: 'Keep track of multiple tasks',
    message: `Just create a new task on the left hand side bar!`,
  },
]

export function EmptyScreen({ setInput }: Pick<UseChatHelpers, 'setInput'>) {
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
              onClick={() => setInput(message.message)}
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
