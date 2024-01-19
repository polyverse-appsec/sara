import { auth } from '@/auth'
import { kv } from '@vercel/kv'
import OpenAI from 'openai'

import { stripUndefinedObjectProperties } from '@/lib/polyverse/backend/backend'
import { querySara } from '@/lib/polyverse/sara/sara'
import { nanoid } from '@/lib/utils'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  console.log(`In POST of route.ts - req: ${JSON.stringify(req)}`)
  const json = await req.json()
  const { messages, project, chat, task } = json
  const session = await auth()
  const userId = session?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401,
    })
  }

  const persistAssistantMessagesCallback = async (
    retrievedAssistantMessages: string,
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
      projectId: project?.id,
      messages: [
        ...messages,
        {
          content: retrievedAssistantMessages,
          role: 'assistant',
        },
      ],
    }

    console.log("starting to store chat's messages for chat id: ", id)
    const cleanPayload = stripUndefinedObjectProperties(payload)
    await kv.hmset(`chat:${id}`, cleanPayload)

    let key = `user:chat:${userId}`
    if (task?.id) {
      key = `task:chats:${task.id}`
    }
    console.log(`storing chat at key: ${key}`)
    await kv.zadd(key, {
      score: createdAt,
      member: `chat:${id}`,
    })
    console.log(`stored chat at key: ${key}`)
  }

  const assistantMessagesStream = await querySara(
    userId,
    project,
    task,
    chat,
    messages,
    persistAssistantMessagesCallback,
  )

  // Create and return the response
  return new Response(assistantMessagesStream, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
