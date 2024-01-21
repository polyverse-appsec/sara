import { auth } from '@/auth'
import { kv } from '@vercel/kv'
import OpenAI from 'openai'

import { stripUndefinedObjectProperties } from '@/lib/polyverse/backend/backend'
import { querySara } from '@/lib/polyverse/sara/sara'
import { nanoid } from '@/lib/utils'
import { json } from 'stream/consumers'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const deserializeAndValidateRequestBody = async (req: Request) => {
  const json = await req.json()
  const { messages, project, chat, task } = json

  if (!task) {
    throw new Error('No task found')
  }

  if (!task.id) {
    throw new Error(`Task is missing the property 'id'`)
  }

  return json
}

export async function POST(req: Request) {
  const session = await auth()
  const userId = session?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401,
    })
  }

  let jsonBody = null

  try {
    jsonBody = await deserializeAndValidateRequestBody(req)
  } catch (err) {
    if (err instanceof Error) {
      return new Response(err.message, {
        status: 400,
      })
    }

    return new Response('Validation failed', {
      status: 400,
    })
  }

  const { id, messages, project, chat, task } = jsonBody

  const persistAssistantMessagesCallback = async (
    retrievedAssistantMessages: string,
  ) => {
    const title = messages[0].content.substring(0, 100)
    const createdAt = Date.now()
    const path = `/chat/${id}`
    const payload = {
      id: id ?? nanoid(),
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

    const key = `task:chats:${task.id}`

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
