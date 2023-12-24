import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'
import { Thread, Threads } from 'openai/resources/beta/threads/threads'

import { configAssistant } from '@/lib/polyverse/openai/assistants'
import { appendUserMessage, getAssistantMessages, listMessages } from '@/lib/polyverse/openai/messages'
import { configThread } from '@/lib/polyverse/openai/threads'
import { DEMO_REPO } from '@/lib/polyverse/config'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const OPENAI_RUN_STATUS_COMPLETED = 'completed'

// TODO: Comment
// TODO: Move to our own API file
// TODO: Is the best name for the parameter 'question' or 'messages'?
// TODO: Restrict the messagesReadyCallback function with TS
const querySara = async (question: any, messagesReadyCallback: any) => {
  const assistant = await configAssistant(DEMO_REPO)
  console.log(`Configured an assistant with an ID of '${assistant.id}' - metadata: ${JSON.stringify(assistant.metadata)}`)

  // Configure a thread based off of what would be the first message associated with it
  const thread = await configThread(question[0].content)
  console.log(`Configured a thread with an ID of '${thread.id}' - first message content: ${question[0].content}`)

  // Blindly append a user message to the thread. It is 'blind' in the sense
  // that the same user message could already exist in the thread.
  const threadMessage = await appendUserMessage(thread, question)
  console.log(`Updated message with an ID of '${threadMessage?.id}' - message content: ${JSON.stringify(threadMessage?.content)}`)

  // TODO: Move this to a runs.ts file?
  // TODO: Start here - I think I am going to use a promise for the OpenAI stream and then
  // return something from this route handler but what? I need to understand what NextJS handlers expect in return
  // It looks like a middleware pattern where a response is returned?
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id
  })


  // TODO: Udpate comments
  //now every half second poll the thread for to see if we had a completed status
  //if so, break out of the loop and then fetch messages.
  //if not, keep polling

  // TODO: Do I await this ReadableStream as a Pronise I create and then it ought to be the content of the stream which would be required for persistance reasons?
  // TODO: Do I need to implement the other parts of this interface?
  // https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
  // https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultController
  // TODO: Can I return something in an array that has the stream and the complete response as well for a callback?

  return new ReadableStream({
    start(controller) {
      // TODO: Do I need to add error handling for the interval?
      // TODO: Do I need to add error handling for the run?

      // Periodically monitor the status of the run until it moves into the
      // 'completed' state at which point we need to cancel the interval.
      const intervalID = setInterval(async () => {
        const { status } = await openai.beta.threads.runs.retrieve(thread.id, run.id)

        // Once the run is completed check for the final message in the thread
        // that the run was performed on. It ought to be the message from the
        // assistant.
        if (status === OPENAI_RUN_STATUS_COMPLETED) {
          // Be sure to close out our interval that we have running periodically.
          // Close it out first in the event that retrieving the list of messages
          // fails.
          clearInterval(intervalID)

          const assistantMessages = await getAssistantMessages(thread.id)
          console.log(`Concatenated assistant messages: ${assistantMessages}`)

          // Enqueue a new line first since we have been creating a progress bar
          // of dots while waiting for our answer
          controller.enqueue('\n')
          // TODO: What if we fail getting the assistant messages? How do we guard against closing the stream properly?
          controller.enqueue(assistantMessages)
          // TODO: Start here on persisting the result - or do I need to? Can I persist the result based on what was returned from this?
          controller.close()

          // Call bck for anyone that is interested in the message that was retrieved
          messagesReadyCallback(assistantMessages)

          return
        }

        // Show a little progress bar of dots if messages aren't yet ready
        controller.enqueue('.')
      }, 500)
    }
  })
}

export async function POST(req: Request) {
  console.log(`In POST of route.ts - req: ${JSON.stringify(req)}`)
  const json = await req.json()
  const { messages, previewToken } = json
  const userId = (await auth())?.user.id

  console.log('messages are', messages)

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }


  const persistAssistantMessagesCallback = async (retrievedAssistantMessages: string) => {
    console.log(`**** persistAssistantMessagesCallback: ${retrievedAssistantMessages}`)

      const title = json.messages[0].content.substring(0, 100)
      const id = json.id ?? nanoid()
      const createdAt = Date.now()
      const path = `/chat/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages,
          {
            content: retrievedAssistantMessages,
            role: 'assistant'
          }
        ]
      }

      await kv.hmset(`chat:${id}`, payload)
      await kv.zadd(`user:chat:${userId}`, {
        score: createdAt,
        member: `chat:${id}`
      })
  }

  const assistantMessagesStream = await querySara(messages, persistAssistantMessagesCallback)

  // Create and return the response
  return new Response(assistantMessagesStream, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })
}

function concatenateAssistantMessages(finalMessages: any[]): string {
  console.log(`concatenateAssistantMessages - finalMessages: ${JSON.stringify(finalMessages)}`)
  let concatenatedText = ''

  for (const message of finalMessages) {
    if (message.role === 'assistant') {
      message.content.forEach((contentItem: any) => {
        if (contentItem.type === 'text') {
          concatenatedText += contentItem.text.value + '\n'
        }
      })
    } else if (message.role === 'user') {
      break
    }
  }

  return concatenatedText.trim()
}
