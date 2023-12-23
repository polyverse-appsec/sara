import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'
import { Thread, Threads } from 'openai/resources/beta/threads/threads'

import { configAssistant } from '@/lib/polyverse/openai/assistants'
import { configThread } from '@/lib/polyverse/openai/threads'
import { DEMO_REPO } from '@/lib/polyverse/config'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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

  // TODO: I think I ultimately want to move this function/refactor it but it depends on a completion in the outer scope
  const assistantStream = await processAssistantMessage(messages)

  let completion = ''

  async function processAssistantMessage(messages: any) {
    const assistant = await configAssistant(DEMO_REPO)
    console.log(`Configured an assistant with an ID of '${assistant.id}' - metadata: ${JSON.stringify(assistant.metadata)}`)

    // Configure a thread based off of what would be the first message associated with it
    const thread = await configThread(messages[0].content)
    console.log(`Configured a thread with an ID of '${thread.id}' - first message content: ${messages[0].content}`)

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
