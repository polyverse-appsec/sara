import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken } = json
  const userId = (await auth())?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  setupAssistant('http://github.com/polyverse-appsec/thrv.com')

  if (previewToken) {
    openai.apiKey = previewToken
  }

  const res = await openai.chat.completions.create({
    model: 'gpt-4-1106-preview',
    messages,
    temperature: 0.7,
    stream: true
  })

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
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
  })

  return new StreamingTextResponse(stream)
}

async function findAssistant(repo: string) {
  const assistants = await openai.beta.assistants.list()
  console.log('assistants are', assistants.data)
  //assistant.data is an array of objects, look through and see if d.metdata.repo === repo (if the repo field exists)
  //if so, return that assistant
  if (assistants.data.length > 0) {
    assistants.data.forEach((d: any) => {
      if (d.metadata.repo === repo) {
        return d
      }
    })
    return null
  }
}

async function fetchFileIds(repo: string, email: string) {
  const apiUrl = `https://pt5sl5vwfjn6lsr2k6szuvfhnq0vaxhl.lambda-url.us-west-2.on.aws/api/get_vectordata_from_project?uri=${encodeURIComponent(
    repo as string
  )}&email=${encodeURIComponent(email as string)}`

  try {
    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }
    const data = await response.json()
    console.log('data is', data)
    return data
  } catch (error) {
    console.log('error is', error)
  }
  return null
}

function createAssistant(repo: string) {
  fetchFileIds(repo, 'alex@polyverse.com')
  return null
}

function setupAssistant(repo: string) {
  //look to see if we have an assistant, if not create one
  const assistant = findAssistant(repo)
  if (!assistant) {
    createAssistant(repo)
  }
}
