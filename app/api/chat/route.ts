import OpenAI from 'openai'

import { kv } from '@vercel/kv'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

import { querySara } from '@/lib/polyverse/sara/sara'
import { stripUndefinedObjectProperties } from '@/lib/polyverse/backend/backend'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  console.log(`In POST of route.ts - req: ${JSON.stringify(req)}`)
  const json = await req.json()
  const { messages, repo, task, chat } = json
  const session = await auth()
  const userId = session?.user.id
  //console.log(`In POST of route.ts - json: ${JSON.stringify(json)}`)

  //console.log('messages are', messages)

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  const persistAssistantMessagesCallback = async (
    retrievedAssistantMessages: string
  ) => {
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
      taskId: task?.id,
      repoId: repo?.full_name,
      messages: [
        ...messages,
        {
          content: retrievedAssistantMessages,
          role: 'assistant'
        }
      ]
    }

    const cleanPayload = stripUndefinedObjectProperties(payload)
    await kv.hmset(`chat:${id}`, cleanPayload)

    let key = `user:chat:${userId}`
    if (task?.id) {
      key = `task:chats:${task.id}`
    }
    console.log(`storing chat at key: ${key}`)
    await kv.zadd(key, {
      score: createdAt,
      member: `chat:${id}`
    })
  }

  const assistantMessagesStream = await querySara(
    repo,
    task,
    chat,
    messages,
    persistAssistantMessagesCallback
  )

  // Create and return the response
  return new Response(assistantMessagesStream, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })
}
