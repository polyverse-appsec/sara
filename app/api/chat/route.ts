import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'
import { Thread } from 'openai/resources/beta/threads/threads'

import { configAssistant } from '@/lib/polyverse/openai/assistants'
import { DEMO_REPO } from '@/lib/polyverse/config'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  console.log(`In POST of route.ts`)
  const json = await req.json()
  const { messages, previewToken } = json
  const userId = (await auth())?.user.id

  console.log('messages are', messages)

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  const assistantStream = await processAssistantMessage(messages)

  let completion = ''

  async function processAssistantMessage(messages: any) {
    const assistant = await configAssistant(DEMO_REPO)
    console.log(`Configured an assistant with an ID of '${assistant.id}' - metadata: ${JSON.stringify(assistant.metadata)}`)

    // TODO: Start here

    const thread = await findOrCreateThread(messages)
    console.log('thread is', thread)

    const threadMessages = await updateMessages(thread, messages)

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id
    })

    //now every half second poll the thread for to see if we had a completed status
    //if so, break out of the loop and then fetch messages.
    //if not, keep polling
    let status = 'active'
    const nodeReadable = new ReadableStream({
      start(controller) {
        const interval = setInterval(async () => {
          const localRun = await openai.beta.threads.runs.retrieve(
            thread.id,
            run.id
          )
          status = localRun.status
          if (status === 'completed') {
            const finalMessages = await openai.beta.threads.messages.list(
              thread.id
            )
            clearInterval(interval)
            //loop through finalMessages as long as tthe role is 'assistant'.  Stop at the first 'user' role
            //then return a string of all messages.content.text.value joined together
            completion = concatenateAssistantMessages(finalMessages.data)
            console.log('completion is', completion)
            controller.enqueue(completion)
            await persistResult()
            controller.close()
            return
          }
          controller.enqueue('.')
        }, 500)
      }
    })
    return nodeReadable
  }

  // Function to monitor the stream
  async function persistResult() {
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
          content: completion,
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
  // Create and return the response
  return new Response(assistantStream, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })
}

// This is a global object hash to store our key-value pairs
const threadMap: Record<string, string> = {}

// A simple hash function to shorten a long string
// Note: This is not a cryptographically secure hash and is just for demonstration
function simpleHash(str: string) {
  // Ensure str is a string
  if (typeof str !== 'string') {
    console.error('simpleHash expects a string argument')
    return 0 // or handle this case as appropriate
  }

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}

// Function to add a key-value pair to the map
function addThread(longString: string, value: string): void {
  const shortKey = simpleHash(longString)
  threadMap[shortKey] = value
}

// Function to get a value using a long string key
function getThread(longString: string): string | undefined {
  const shortKey = simpleHash(longString)
  return threadMap[shortKey]
}

async function findOrCreateThread(messages: any) {
  //check if we have a thread id in the messages, if so, return that
  //if not, create a new thread id and return that
  const threadId = getThread(messages[0].content)
  if (threadId) {
    return openai.beta.threads.retrieve(threadId)
  } else {
    const newThreadId = await openai.beta.threads.create()
    addThread(messages, newThreadId.id)
    return newThreadId
  }
}

async function updateMessages(thread: Thread, messages: any) {
  //add messages to the thread. we will just take the last 'user' message and add it to the thread
  const length = messages.length
  const lastMessage = messages[length - 1]
  if (lastMessage.role === 'user') {
    const threadMessages = await openai.beta.threads.messages.create(
      thread.id,
      {
        role: 'user',
        content: lastMessage.content
      }
    )
    return threadMessages
  }
  return null
}

function concatenateAssistantMessages(finalMessages: any[]): string {
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
