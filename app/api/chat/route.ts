import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'
import { Assistant } from 'openai/resources/beta/assistants/assistants'
import { Thread } from 'openai/resources/beta/threads/threads'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
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

  // Create and return the response
  return new Response(assistantStream, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })
  /*
  return new StreamingTextResponse(assistantStream)
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
  */
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

async function findAssistant(repo: string): Promise<Assistant | null> {
  const assistants = await openai.beta.assistants.list()
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
  return null
}

async function fetchFileIds(repo: string, email: string): Promise<string[]> {
  const apiUrl = `https://pt5sl5vwfjn6lsr2k6szuvfhnq0vaxhl.lambda-url.us-west-2.on.aws/api/get_vectordata_from_project?uri=${encodeURIComponent(
    repo as string
  )}&email=${encodeURIComponent(email as string)}`

  try {
    const response = await fetch(apiUrl)
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }
    const data = await response.json()
    //data.body is json string, convert to an object
    const parsedData = JSON.parse(data.body)
    console.log('parsedData is', parsedData)
    return parsedData
  } catch (error) {
    console.log('error is', error)
  }
  return []
}

async function createAssistant(repo: string) {
  const fileIds = await fetchFileIds(repo, 'alex@polyverse.com')
  const assistant = await openai.beta.assistants.create({
    model: 'gpt-4-1106-preview',
    name: 'Polyverse Boost Sara',
    file_ids: fileIds,
    instructions:
      'You are a coding assitant named Sara. You have access to a the full codebase of a project in your files, including an aispec.md file that summarizes the code. When asked a coding question, unless otherwise explicitly told not to, you give answers that use the relevant frameworks, apis, data structures, and other aspects of the existing code.  There are at least three files in your files that will help you answer questions.  1. blueprint.md is a very short summary of the overall architecture. It talks about what programming languages are used, major frameworks, and so forth.  2. aispec.md is another useful, medium size file. It has short summaries of all of the important code.  Finally, allfiles_concat.md is the concatenation of all of the source code in the project.  For all queries, use the blueprint and aispec files. Retrieve code snippets as needed from the concatenated code file.',
    tools: [{ type: 'code_interpreter' }, { type: 'retrieval' }],
    metadata: {
      repo: repo
    }
  })
  return assistant
}

async function updateAssistant(repo: string, assistant: Assistant) {
  //make sure we have the most up to date file ids
  const fileIds = await fetchFileIds(repo, 'alex@polyverse.com')
  //update the assistant with the new file ids
  await openai.beta.assistants.update(assistant.id, {
    file_ids: fileIds
  })
}

async function setupAssistant(repo: string) {
  //look to see if we have an assistant, if not create one
  let assistant = await findAssistant(repo)
  if (!assistant) {
    assistant = await createAssistant(repo)
  } else {
    updateAssistant(repo, assistant)
  }
  console.log('assistant is', assistant.id, assistant.metadata)
  return assistant
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

async function processAssistantMessage(messages: any) {
  const assistant = await setupAssistant(
    'http://github.com/polyverse-appsec/thrv.com'
  )
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
          controller.enqueue(concatenateAssistantMessages(finalMessages.data))
          console.log('finalMessages are', finalMessages.data)
          controller.close()
          return
        }
        console.log('status is', status)
        controller.enqueue('Sara is thinking...\n')
      }, 500)
    },
    cancel() {
      // This is called if the reader cancels
      console.log('cancel()')
    },
    pull(controller) {
      // This is called if the reader wants more data
      console.log('pull()')
    }
  })
  return nodeReadable
}

// Function to convert a Node.js stream to a web standard ReadableStream
/*
function nodeToWebReadableStream(
  nodeStream: Readable
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on('data', (chunk: Iterable<number>) => {
        controller.enqueue(new Uint8Array(chunk))
      })
      nodeStream.on('end', () => {
        controller.close()
      })
      nodeStream.on('error', (err: any) => {
        controller.error(err)
      })
    }
  })
}
*/
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
