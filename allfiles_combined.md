# Contents of middleware.ts:
export { auth as middleware } from './auth'

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}



# Contents of tailwind.config.js:
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)']
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        }
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 }
        },
        'slide-from-left': {
          '0%': {
            transform: 'translateX(-100%)'
          },
          '100%': {
            transform: 'translateX(0)'
          }
        },
        'slide-to-left': {
          '0%': {
            transform: 'translateX(0)'
          },
          '100%': {
            transform: 'translateX(-100%)'
          }
        }
      },
      animation: {
        'slide-from-left':
          'slide-from-left 0.3s cubic-bezier(0.82, 0.085, 0.395, 0.895)',
        'slide-to-left':
          'slide-to-left 0.25s cubic-bezier(0.82, 0.085, 0.395, 0.895)',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')]
}



# Contents of next.config.js:
/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**'
      }
    ]
  },
  webpack: (config, { dev }) => {
    // Enable source maps in development mode
    if (dev) {
      config.devtool = 'source-map'
    }
    return config
  }
}



# Contents of next-env.d.ts:
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.



# Contents of auth.ts:
import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { Organization } from '@/lib/types'
import exp from 'constants'

export const {
  handlers: { GET, POST },
  auth
} = NextAuth({
  providers: [
    GitHub({
      authorization: {
        params: { scope: 'user:email, read:org, read:user, repo' }
      }
    })
  ],
  callbacks: {
    jwt({ token, profile, account }) {
      if (profile) {
        token.id = profile.id
        token.username = profile.login // Save the GitHub username
        token.image = profile.avatar_url || profile.picture
        token.email = profile.email
      }
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    session: ({ session, token }) => {
      if (session?.user && token?.id) {
        session.user.id = String(token.id)
        session.user.username = (token as any).username as string // Type assertion
      }
      if (token?.accessToken && typeof token.accessToken === 'string') {
        session.accessToken = token.accessToken
      }
      return session
    },
    authorized({ auth }) {
      return !!auth?.user // this ensures there is a logged in user for -every- request
    }
  },
  pages: {
    signIn: '/sign-in' // overrides the next-auth default signin page https://authjs.dev/guides/basics/pages
  }
})



# Contents of types/next-auth.d.ts:
import NextAuth, { DefaultSession } from 'next-auth'

import { Organization, Repository, Task } from '@/lib/types'

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      username: string
      id: string
      image?: string
      email?: string
    } & DefaultSession['user']
    accessToken: string
    activeOrganization?: Organization
    activeRepository?: Repository
    activeTask?: Task
    referenceRepositories?: {
      organization: Organization
      repository: string
    }[]
  }
}



# Contents of app/actions.ts:
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { kv } from '@vercel/kv'

import { auth } from '@/auth'
import { type Chat } from '@/lib/types'
import {
  fetchUserOrganizations,
  fetchOrganizationRepositories
} from '@/lib/polyverse/github/repos'
import { Organization, Repository, Task } from '@/lib/types'
import { nanoid } from '@/lib/utils'

const KEY_SEGMENT_REPOSITORY = 'repository'

export async function getChats(userId?: string | null, taskId?: string) {
  if (!userId) {
    return []
  }

  try {
    const pipeline = kv.pipeline()
    //if we have a taskId, get the chats associated with that task, otherwise get the chats associated with the user
    const chats: string[] = await kv.zrange(
      taskId ? `task:chats:${taskId}` : `user:chat:${userId}`,
      0,
      -1,
      {
        rev: true
      }
    )

    for (const chat of chats) {
      pipeline.hgetall(chat)
    }

    const results = await pipeline.exec()

    return results as Chat[]
  } catch (error) {
    return []
  }
}

export async function getChat(id: string, userId: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || (userId && chat.userId !== userId)) {
    return null
  }

  return chat
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  const uid = await kv.hget<string>(`chat:${id}`, 'userId')

  if (uid !== session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  await kv.del(`chat:${id}`)
  if (session.activeTask?.id) {
    await kv.zrem(`task:chats:${session.activeTask?.id}`, `chat:${id}`)
  } else {
    await kv.zrem(`user:chat:${session.user.id}`, `chat:${id}`)
  }

  revalidatePath('/')
  return revalidatePath(path)
}

export async function clearChats() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }
  let key = `user:chat:${session.user.id}`
  if (session.activeTask?.id) {
    key = `task:chats:${session.activeTask?.id}`
  }
  const chats: string[] = await kv.zrange(key, 0, -1)
  if (!chats.length) {
    return redirect('/')
  }
  const pipeline = kv.pipeline()

  for (const chat of chats) {
    pipeline.del(chat)
    pipeline.zrem(`user:chat:${session.user.id}`, chat)
  }

  await pipeline.exec()

  revalidatePath('/')
  return redirect('/')
}

export async function getSharedChat(id: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || chat.userId !== session.user.id) {
    return {
      error: 'Something went wrong'
    }
  }

  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`
  }

  await kv.hset(`chat:${chat.id}`, payload)

  return payload
}

/*
 * Github related functions
 */

export async function getOrganizations(): Promise<Organization[]> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const orgs = await fetchUserOrganizations({
    accessToken: session.accessToken
  })
  return orgs
}

export async function getRepositoriesForOrg(org: string): Promise<Repository[]> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  const repos = await fetchOrganizationRepositories({
    accessToken: session.accessToken,
    org
  })
  return repos
}

/*
 * Task related functions
 */
export async function createTask(task: Task): Promise<Task> {
  const session = await auth()

  if (!session?.user?.id || task.userId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  const id = task.id || nanoid()
  const createdAt = task.createdAt || new Date()
  const taskData = {
    ...task,
    id,
    createdAt
  }

  await kv.hset(`task:${id}`, taskData)
  await kv.zadd(`user:tasks:${session.user.id}`, {
    score: +createdAt,
    member: `task:${id}`
  })

  return taskData
}

export async function getTask(
  taskId: string,
  userId: string
): Promise<Task | null> {
  const session = await auth()

  if (!session?.user?.id || userId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  const task = await kv.hgetall<Task>(`task:${taskId}`)

  if (!task || task.userId !== userId) {
    return null
  }

  return task
}

/*
 * Repository related functions
 */

/**
 * Builds the hash key for persisting and retrieving repository fields.
 *
 * @param {string} fullRepoName Full name of the repository
 * @returns Hash key for repository.
 */
const buildRepositoryHashKey = (fullRepoName: string) => `${KEY_SEGMENT_REPOSITORY}:${fullRepoName}`

/**
 * Server action that retrieves the most recent persisted information about a
 * specific repository identified in the `repo.full_name` data member. If the
 * repository doesn't exist then persists any information contained within the
 * fully formed `repo` parameter.
 *
 * @param {Repository} repo Object instance of a repo. Must be fully formed in
 * the event the repo doesn't exist and is to be created.
 * @param {string} userId The ID of the user who is authorized to retrieve or
 * persist the repo name.
 * @returns {Repository} Retrieved or persisted repository info.
 */
export async function getOrCreateRepository(repo: Repository, userId: string): Promise<Repository> {
  // Rather than delegate auth to functions we consume we protect ourselves and
  // do a check here before we consume each method as well in case there are any
  // behavioral changes to said consumed functions.
  const session = await auth()

  // Apply business logic auth check for `getRepository`
  if (!session?.user?.id || userId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  const retrievedRepo = await getRepository(repo.full_name, userId)

  if (retrievedRepo) {
    return retrievedRepo
  }

  // Apply business logic auth check for `createRepository`
  //
  // Per our current implementation of our types we assume that the `orgId`
  // matches the ID of the user that owns the repo
  // if (repo.orgId !== session.user.id) {
  //   throw new Error('Unauthorized')
  // }

  return await createRepository(repo)
}

/**
 * Hashes the fields of a repository object.
 *
 * @param {Repository} repo Fully formed instance of Repository object.
 * @returns {Repository} The presisted repository object.
 */
export async function createRepository(repo: Repository): Promise<Repository> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Per our current implementation of our types we assume that the `orgId`
  // matches the ID of the user that owns the repo
  // if (repo.orgId !== session.user.id) {
  //   throw new Error('Unauthorized')
  // }

  const repoKey = buildRepositoryHashKey(repo.full_name)
  await kv.hset(repoKey, repo)

  return repo
}

// TODO Chris: Should this funciton work in a way where we pull the existing repo first
// and then spread out the properties on it from the 'repo' param and then update it?
// My concern is that empty properies on the passed in 'repo' it will remove the fields.
// But maybe this isn't how Redis behaves and my lack of knowledge is posing this question?

/**
 * Updates a the fields of an existing repository object. Note that if the repo
 * doesn't yet exist then it will create the object as well based on current
 * implementation.
 *
 * @param {Repository} repo Fully formed instance of Repository object to
 * update.
 * @returns {Repository} The updated repository object.
 */
export async function updateRepo(repo: Repository): Promise<Repository> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // TODO: Should we just ahve a createOrUpdateRepo function? Is creating same behavior
  // as updating?

  // Per our current implementation of our types we assume that the `orgId`
  // matches the ID of the user that owns the repo
  // if (repo.orgId !== session.user.id) {
  //   throw new Error('Unauthorized')
  // }

  const repoKey = buildRepositoryHashKey(repo.full_name)
  await kv.hset(repoKey, repo)

  return repo
}

/**
 * Retrieves the fields of a repository if it exists. If not it returns `null`.
 *
 * @param {string} fullRepoName The full name of the repository to retrieve.
 * @param {string} userId The ID of the user that is authorized to retrieve the
 * details of the repository.
 * @returns {(Repositry|null)} The repository if it exists otherwise `null`.
 */
export async function getRepository(
  fullRepoName: string,
  userId: string
): Promise<Repository | null> {
  const session = await auth()

  if (!session?.user?.id || userId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  const repoKey = buildRepositoryHashKey(fullRepoName)
  const repo = await kv.hgetall<Repository>(repoKey)

  // Per our current implementation of our types we assume that the `orgId`
  // matches the ID of the user that owns the repo
  // if (!repo || repo.orgId !== session.user.id) {
  //   return null
  // }

  return repo
}



# Contents of app/api/chat/route.ts:
import OpenAI from 'openai'

import { kv } from '@vercel/kv'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

import { querySara } from '@/lib/polyverse/sara/sara'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  console.log(`In POST of route.ts - req: ${JSON.stringify(req)}`)
  const json = await req.json()
  const { messages, previewToken } = json
  const session = await auth()
  const userId = session?.user.id
  console.log(`In POST of route.ts - json: ${JSON.stringify(json)}`)

  console.log('messages are', messages)

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
      messages: [
        ...messages,
        {
          content: retrievedAssistantMessages,
          role: 'assistant'
        }
      ]
    }

    await kv.hmset(`chat:${id}`, payload)

    let key = `user:chat:${userId}`
    if (session.activeTask?.id) {
      key = `task:chats:${session.activeTask?.id}`
    }
    await kv.zadd(key, {
      score: createdAt,
      member: `chat:${id}`
    })
  }

  const assistantMessagesStream = await querySara(
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



# Contents of app/api/auth/[...nextauth]/route.ts:
export { GET, POST } from '@/auth'
export const runtime = 'edge'



# Contents of lib/utils.ts:
import { clsx, type ClassValue } from 'clsx'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7
) // 7-character random string

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init)

  if (!res.ok) {
    const json = await res.json()
    if (json.error) {
      const error = new Error(json.error) as Error & {
        status: number
      }
      error.status = res.status
      throw error
    } else {
      throw new Error('An unexpected error occurred')
    }
  }

  return res.json()
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}



# Contents of lib/types.ts:
import { type Message } from 'ai'

/*
 ** Sara data model **

We have a user, represented by a github id. We store additional information about the user,
such as their email address.

Each user has a set of repositories that they have access to. The ids of these repositories is stored in a set called `user:repos:${userId}`.

Each repository object is stored in a KV namespace called `repo:${repoid}`. Note that the id is *per user*. I.e. in a team
environment, each user will have their own repository object to hang on to their own specific chats (which are not shared by default)

Each repository has a set of reference repositories. This is stored in the data fields of the repository object

A respository has a set of tasks. The ids of these tasks is stored in a sorted set called `repo:tasks:${repoId}`.

Each task is stored in a KV namespace called `task:${taskId}`.

A task can have a set of subtasks, which are stored in a sorted set called `task:subtasks:${taskId}`.

The core model is a chat. 

Chats are stored in a KV namespace called `chat:${id}`.

Each task has a set of chats, the ids of these chats is stored in a sorted set called `task:chats:${taskId}`.

The user can have a sequence of chats not associated with any task. Therse are stored in a sorted set called `user:chat:${userId}`.

*/

export interface User extends Record<string, any> {
  id: string
  username: string
  image?: string
  email?: string
  defaultTask?: Task
}

// Define the simplified Organization type
export type Organization = {
  login: string // The organization's login name
  avatar_url: string // The URL of the organization's avatar
}

export interface Repository extends Record<string, any> {
  full_name: string
  name: string
  description: string
  orgId: string
  referenceRepositories?: {
    organization: string
    repository: string
  }[]
  tasks?: Task[]
  defaultTask?: Task
}

export interface Task extends Record<string, any> {
  id: string
  title: string
  description: string
  createdAt: Date
  userId: string
  repositoryId: string
  chats?: Chat[]
  subtasks?: Task[]
}

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
  taskId?: string
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>



# Contents of lib/polyverse/config.ts:
export const DEMO_EMAIL_ADDRESS = 'alex@polyverse.com'
export const DEMO_REPO = 'http://github.com/polyverse-appsec/thrv.com'


# Contents of lib/polyverse/sara/sara.ts:
import { configAssistant } from '../openai/assistants'
import { OPENAI_RUN_STATUS_COMPLETED } from '../openai/constants'
import { appendUserMessage, getAssistantMessages } from '../openai/messages'
import { getThreadRunStatus, runAssistantOnThread } from '../openai/runs'
import { configThread } from '../openai/threads'

import { DEMO_REPO } from '@/lib/polyverse/config'

/**
 * Callback for those interested into the response that Sara returned.
 * 
 * @typedef {function(string)} FullSaraResponseCallback
 */

/**
 * Asks Sara a question for processing. Optionally a callback can be provided
 * that when Saras response is ready will be provided.
 * 
 * A list of messages to ask Sara is expected as a parameter but presently only
 * the first entry in the list will be used to ask Sara a question.
 * 
 * Sara will stream her response as she generates. A 'ReadableStream' will be
 * returned which can be consumed or passed along to something like a 'Response'
 * object instance.
 * 
 * @param question List of questions to ask Sara. Only the
 * @param {FullSaraResponseCallback} [fullSaraResponseCallback] Optional
 * callback with Saras full response.
 * 
 * @returns {ReadableStream} A 'ReadableStream' object that can be used for
 * streaming Sara's response in realtime.
 */
export const querySara = async (question: any, fullSaraResponseCallback?: any) => {
    const assistant = await configAssistant(DEMO_REPO)
    console.log(`Configured an assistant with an ID of '${assistant.id}' - metadata: ${JSON.stringify(assistant.metadata)}`)

    // Configure a thread based off of what would be the first message associated with it
    const thread = await configThread(question[0].content)
    console.log(`Configured a thread with an ID of '${thread.id}' - first message content: ${question[0].content}`)

    // Blindly append a user message to the thread. It is 'blind' in the sense
    // that the same user message could already exist in the thread.
    const threadMessage = await appendUserMessage(thread, question)
    console.log(`Updated message with an ID of '${threadMessage?.id}' - message content: ${JSON.stringify(threadMessage?.content)}`)

    const { id: runID } = await runAssistantOnThread(assistant.id, thread.id)

    return new ReadableStream({
        start(controller) {
            // Periodically monitor the status of the run until it moves into the
            // 'completed' state at which point we need to cancel the interval.
            const intervalID = setInterval(async () => {
                const status = await getThreadRunStatus(runID, thread.id)

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
                    controller.enqueue(assistantMessages)
                    
                    controller.close()

                    // Call bck for anyone that is interested in the message that was retrieved
                    if (fullSaraResponseCallback) {
                        fullSaraResponseCallback(assistantMessages)
                    }

                    return
                }

                // Show a little progress bar of dots if messages aren't yet ready
                controller.enqueue('.')
            }, 500)
        }
    })
}


# Contents of lib/polyverse/typescript/helpers.ts:
/**
 * TypeScript type guard to allow narrowing of 'unknown' to Record<string, unknown>.
 * Should only be used when we are more sure that the propery exists than TypeScript.
 * 
 * @param value Value whose value we wish to identify as a Record<string, unknown> or not
 * @returns {boolean} Whether the value is a Record<string, unknown> or not
 */
export const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value != null


# Contents of lib/polyverse/backend/backend.ts:
const GET_VECTORDATA_FROM_PROJECT_URL = 'https://pt5sl5vwfjn6lsr2k6szuvfhnq0vaxhl.lambda-url.us-west-2.on.aws/api/get_vectordata_from_project'

const buildGetVectorDataFromProjectURL = (repo: string, email: string) => `${GET_VECTORDATA_FROM_PROJECT_URL}?uri=${encodeURIComponent(repo)}&email=${encodeURIComponent(email)}`

/**
 * Gets the files IDs associated with a user and a Git repo.
 * 
 * @param repo {string} Git URL for a repo.
 * @param email {string} Email associated with user.
 * @returns {Promise<string[]>} Promise of an array of strings. Array will be empty in the event of an error.
 */
export async function getFileIDs(repo: string, email: string): Promise<string[]> {
    const url = buildGetVectorDataFromProjectURL(repo, email)
  
    try {
      const res = await fetch(url)
  
      if (!res.ok) {
        console.error(`Got a failure response while trying to get file IDs for '${repo}/${email}' - Status: ${res.status}`)
        return []
      }
  
      const rawData = await res.json()
      const fileIDs = JSON.parse(rawData.body)
      
      console.log(`Parsed file IDs: ${fileIDs}`)
  
      return fileIDs
    } catch (error) {
      console.error('Error making a request or parsing a response for file IDs: ', error)
    }
  
    return []
  }


# Contents of lib/polyverse/github/repos.ts:
import { Octokit } from '@octokit/rest'
import { Organization, Repository } from '@/lib/types'
// Define a type for the function's parameters
export type FetchUserOrgsParams = {
  accessToken: string
}

// Function to fetch user's organizations
export async function fetchUserOrganizations({
  accessToken
}: FetchUserOrgsParams): Promise<Organization[]> {
  const octokit = new Octokit({
    auth: accessToken
  })

  try {
    const response = await octokit.request('GET /user/orgs', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    return response.data.map(org => ({
      login: org.login,
      avatar_url: org.avatar_url
    }))
  } catch (error) {
    console.error('Error fetching organizations:', error)
    throw error
  }
}

// Define a type for the function's parameters
export type FetchOrgReposParams = {
  accessToken: string
  org: string
}

// Function to fetch repositories for an organization
export async function fetchOrganizationRepositories({
  accessToken,
  org
}: FetchOrgReposParams): Promise<Repository[]> {
  const octokit = new Octokit({
    auth: accessToken
  })
  let page = 1
  const repos = []

  try {
    while (true) {
      // the api /user/repos is supposed to return all repos for the user, but it doesn't seem to work
      // for private repos unless we have the repo permission. but if we have the repo permission,
      // we can use the more direct /orgs/:org/repos api
      const response = await octokit.request('GET /orgs/' + org + '/repos', {
        type: 'all',
        per_page: 100,
        page: page,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })

      if (response.data.length === 0) {
        break // Exit the loop if no more repos are returned
      }

      repos.push(
        ...response.data.map(
          (repo: { name: any; description: any; full_name: string }) => ({
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            orgId: org
          })
        )
      )
      page++
    }

    return repos
  } catch (error) {
    console.error('Error fetching repositories:', error)
    throw error
  }
}



# Contents of lib/polyverse/task/task.ts:
// Import necessary types and functions
import { Task, User, Repository } from '@/lib/types'
import { createTask, getRepository, getTask, updateRepo } from '@/app/actions'

/**
 * Performs a deep copy of an instance of a Repository.
 *
 * @param {Repository} repo Repo to copy
 * @returns {Repository} Deep copy of repo
 */
const deepCopyRepo = (repo: Repository): Repository => JSON.parse(JSON.stringify(repo)) as Repository

/**
 * Checks to see if a repository has a default task and if it doesn't creates
 * one. If one should exist it returns the default task as part of the provided
 * repo.
 *
 * @param {Repository} repo Repository with filled in default task ID to search
 * on.
 * @param {string} userId ID of user whom this repository object has been
 * created for.
 * @returns {Promise<Repository>} Deep copied instance of the repository with
 * the default task set on it.
 */
export async function configDefaultRepositoryTask(repo: Repository, userId: string): Promise<Repository> {
  // Check to see if there is a task associated with the repo provided as a
  // parameter.
  if (repo.defaultTask?.id) {
    const existingDefaultTask = await getTask(repo.defaultTask.id, userId)

    // If default task does exist provide a deep copy of the repo and add the
    // default task as a reference
    if (existingDefaultTask) {
      const copiedRepo = deepCopyRepo(repo)
      copiedRepo.defaultTask = existingDefaultTask

      return copiedRepo
    }
  }

  // At this point we know there isn't a default task so create one now
  const newDefaultTask = await createDefaultRepositoryTask(repo, userId)

  const copiedRepo = deepCopyRepo(repo)
  copiedRepo.defaultTask = newDefaultTask

  // Ensure we update the repo with the default task
  return await updateRepo(copiedRepo)
}

// Utility to create a default task for a repository

/**
 * Creates a default repository task. Note that the repo doesn't have the task
 * associated with it after calling this.
 *
 * @param {Repository} repo Repository to create the default task for
 * @param {string} userId User ID assocaited with the created repository
 * @returns {Promise<Task>} Created default task
 */
export async function createDefaultRepositoryTask(
  repo: Repository,
  userId: string
): Promise<Task> {

  const defaultTask: Task = {
    id: '', // Generate an ID or leave it for the createTask function to handle
    title: `Task for ${repo.name}`,
    description: `Default task for repository ${repo.name}`,
    createdAt: new Date(),
    // TODO: Commented out for 1/4 Thursday demo - Was hitting auth error in `createTask`
    // on the following logic: if (!session?.user?.id || task.userId !== session.user.id)
    // For the demo we are setting the userId as the owner of this task
    // userId: repo.orgId, // Assuming the orgId represents the user who owns this repo
    userId,
    repositoryId: repo.id,
    chats: [],
    subtasks: []
  }

  return createTask(defaultTask)
}

// Utility to create a default task for a user
export async function createDefaultUserTask(user: User): Promise<Task> {
  const defaultTask: Task = {
    id: '', // Generate an ID or leave it for the createTask function to handle
    title: `Task for ${user.username}`,
    description: `Default task for user ${user.username}`,
    createdAt: new Date(),
    userId: user.id,
    repositoryId: '', // Set this if you have a default repository for the user
    chats: [],
    subtasks: []
  }

  if (user.defaultTask) {
    return user.defaultTask // Return the existing default task if it exists
  }

  return createTask(defaultTask)
}



# Contents of lib/polyverse/openai/runs.ts:
import OpenAI from 'openai'
import { Run } from 'openai/resources/beta/threads/runs/runs'

const oaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

/**
 * Runs the OpenAI assistant on a thread.
 * 
 * @param {string} assistantID ID of the OpenAI assistant to run on a thread.
 * @param {string} threadID ID of the thread to run the OpenAI assistant on.
 * @returns {Run} Object representing the run of the OpenAI assistant on the thread.
 */
export const runAssistantOnThread = (assistantID: string, threadID: string) => {
    return oaiClient.beta.threads.runs.create(threadID, { assistant_id: assistantID }
)}

/**
 * Returns the status of a thread that the OpenAI assistant has been ran on.
 * 
 * @param {string} runID ID of the existing run.
 * @param {string} threadID ID of the thread that is having a run performed on it.
 * @returns {string} Current status of the run on the thread.
 */
export const getThreadRunStatus = async (runID: string, threadID: string) => {
    const { status } = await oaiClient.beta.threads.runs.retrieve(threadID, runID)

    return status;
}


# Contents of lib/polyverse/openai/messages.ts:
import OpenAI from 'openai'

import { OPENAI_MESSAGE_CONTENT_TYPE_TEXT, OPENAI_MESSAGE_ROLE_USER } from './constants'

const oaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

/**
 * Updates the file IDs for an existing OpenAI assistant.
 * 
 * @param {string[]} fileIDs Array of file IDs to associated with the existing OepnAI assistant.
 * @param {Assistant} assistant Existing OpenAI assistant with the 'id' field filled out
 * @returns Promise<Assistant> asdf 
 */

/**
 * Takes the last message from a list of messages and appends it to a thread if
 * the message in question is that from the 'user' role. If a message is
 * appended then the appended message is returned.
 * 
 * @param {Thread} thread The thread to append the message to 
 * @param messages List of messages where the last message is a 'user' message
 * @returns {(Promise<ThreadMessage>|Promise<undefined>)} Returns the appended
 * message or nothing in a promise
 */
export async function appendUserMessage({ id }: { id: string }, messages: any) {
    // If the last message is that of a 'user' message just append another user
    // message to the end of the thread
    const { role, content } = messages[messages.length - 1]

    if (role === OPENAI_MESSAGE_ROLE_USER) {
        return await oaiClient.beta.threads.messages.create(id, { role: OPENAI_MESSAGE_ROLE_USER, content })
    }
}

/**
 * Returns a list of messages for a given thread.
 * 
 * @param {string} threadID ID of thread to get messages for 
 * @returns List of messages associated with a thread
 */
export const listMessages = async (threadID: string) => await oaiClient.beta.threads.messages.list(threadID)

/**
 * Gathers together all messages from the OpenAI assistant in a thread up to
 * the first 'user' message found.
 * 
 * @param {string} threadID ID of the thread to get 'assistant' messages for
 * @returns {string} String of all 'assistant' messages concatenated together
 */
export const getAssistantMessages = async (threadID: string) => {
    const { data: messages } = await listMessages(threadID)

    // Find the first index of a 'user' role messages
    const userIndex = messages.findIndex(({ role }) => role === OPENAI_MESSAGE_ROLE_USER)

    return messages.slice(0, userIndex).reduce((concatenatedMessage, assistantMessage) => {
        assistantMessage.content.forEach((messageContent) => {
            if (messageContent.type === OPENAI_MESSAGE_CONTENT_TYPE_TEXT) {
                concatenatedMessage += messageContent.text.value
                concatenatedMessage += '\n'
            }
        })

        return concatenatedMessage
    }, '').trim()
}



# Contents of lib/polyverse/openai/threads.ts:
import OpenAI from 'openai'

import { Threads } from 'openai/resources/beta/threads/threads'

const oaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

/**
 * Simple global map of created threads and their IDs keyed off of a hash of
 * the first indexed message that would be associated with said thread. 
 */
const threadIDsByMessageContentHashMap: Record<string, string> = {}

/**
 * Simple hash function to shorten a long string
 * 
 * @param stringToHash String to hash
 * @returns Hash of string
 */
function hashString(stringToHash: string) {
    // TODO: This is cryptographically insecure - for demo purposes
    let hash = 0
  
    for (let i = 0; i < stringToHash.length; i++) {
      const char = stringToHash.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
  
    return hash
  }

/**
 * Attempts to retrieve a thread ID based on the contents of a message via a
 * simple hashing algorithm. If the thread ID doesn't yet exist then
 * 'undefined' is returned.
 * 
 * @param {string} messageContent The content of a message that would be associated
 * with a thread
 * @returns {(string|undefined)} Thread ID if thread exists otherwise 'undefined'
 */
function getThreadIDFromMessageContent(messageContent: string): string | undefined {
    const messageContentHash = hashString(messageContent)
    return threadIDsByMessageContentHashMap[messageContentHash]
}

/**
 * Given the content of a message from a thread it maps the ID of the thread
 * with the content based on a simple hashing algorithm.
 * 
 * @param {string} messageContent The content of a message associated with the thread
 * @param {string} threadID The ID of the thread 
 */
function mapThreadID(messageContent: string, threadID: string) {
    const messageContentHash = hashString(messageContent)
    threadIDsByMessageContentHashMap[messageContentHash] = threadID
}

// An OpenAI Thread is the logical representation of a back and forth
// conversation with an OpenAI Assistant. Threads get messages associated with
// them at which point the OpenAI Assistant can be triggered to generate a
// response from the latest message in the thread.

/**
 * Configures an OpenAI thread for use. Configuration is done based on the
 * initial message that would be associated with a thread (i.e the first indexed
 * message). If the thread doesn't yet exist it will create it first.
 * 
 * @param {string} messageContent The initial message that would be associated with a thread.
 * @returns {Promise<Thread>} Promise with the configured OpenAI thread
 */
export async function configThread(messageContent: string): Promise<Threads.Thread> {
    const threadID = getThreadIDFromMessageContent(messageContent)

    if (threadID) {
        return oaiClient.beta.threads.retrieve(threadID)
    }

    const thread = await oaiClient.beta.threads.create()
    mapThreadID(messageContent, thread.id)

    return thread
}


# Contents of lib/polyverse/openai/constants.ts:
export const OPENAI_ASSISTANT_TOOL_CODE_INTERPRETER = 'code_interpreter'
export const OPENAI_ASSISTANT_TOOL_CODE_RETRIEVAL = 'retrieval'

export const OPENAI_MESSAGE_ROLE_ASSISTANT = 'assistant'
export const OPENAI_MESSAGE_ROLE_USER = 'user'

export const OPENAI_MESSAGE_CONTENT_TYPE_TEXT = 'text'

export const OPENAI_MODEL_GPT4_1106_PREVIEW = 'gpt-4-1106-preview'

export const OPENAI_RUN_STATUS_COMPLETED = 'completed'



# Contents of lib/polyverse/openai/assistants.ts:
import OpenAI from 'openai'

import { Assistant } from 'openai/resources/beta/assistants/assistants'

import { DEMO_EMAIL_ADDRESS } from '../config'
import { getFileIDs } from '../backend/backend'
import { isRecord } from '../typescript/helpers'

import {
    OPENAI_ASSISTANT_TOOL_CODE_INTERPRETER,
    OPENAI_ASSISTANT_TOOL_CODE_RETRIEVAL,
    OPENAI_MODEL_GPT4_1106_PREVIEW
} from './constants'


const PV_OPENAI_ASSISTANT_NAME = 'Polyverse Boost Sara'
const PV_OPENAI_ASSISTANT_INSTRUCTIONS = 'You are a coding assistant named Sara. ' +
    'You have access to the full codebase of a project in your files, including an aispec.md file that summarizes the code. ' +
    'When asked a coding question, unless otherwise explicitly told not to, you give answers that use the relevant frameworks, APIs, data structures, and other aspects of the existing code. ' +
    'There are at least three files in your files that will help you answer questions. ' + 
    '1. blueprint.md is a very short summary of the overall architecture. It talks about what programming languages are used, major frameworks, and so forth. ' + 
    '2. aispec.md is another useful, medium size file. It has short summaries of all of the important code. ' + 
    '3. Finally, allfiles_concat.md is the concatenation of all of the source code in the project. ' +
    'For all queries, use the blueprint and aispec files. Retrieve code snippets as needed from the concatenated code file.'

const oaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

/**
 * Creates an OpenAI assistant with files attached to it (by ID) from the repo provided.
 * 
 * @param {string[]} fileIDs Array of file IDs.
 * @param {string} repo Git URL associated with a repo.
 * @returns {Promise<Assistant>} Promise with the created OpenAI assistant.
 */
export async function createAssistantWithFileIDsFromRepo(fileIDs: string[], repo: string): Promise<Assistant> {
    return await oaiClient.beta.assistants.create({
      model: OPENAI_MODEL_GPT4_1106_PREVIEW,
      name: PV_OPENAI_ASSISTANT_NAME,
      file_ids: fileIDs,
      instructions: PV_OPENAI_ASSISTANT_INSTRUCTIONS,
      tools: [{ type: OPENAI_ASSISTANT_TOOL_CODE_INTERPRETER }, { type: OPENAI_ASSISTANT_TOOL_CODE_RETRIEVAL }],
      metadata: { repo }
    })
}

/**
 * Identifies a previously created OpenAI assistant based on a Git URL.
 * 
 * @param {string} repo Git URL associated with an assistant.
 * @returns {(Promise<Assistant>|Promise<undefined>) Promise of identified assistant or Promise of undefined if no assistant found.
 */
export async function findAssistantForRepo(repo: string): Promise<Assistant | undefined> {
    console.log(`findAssistantsForRepo`)
    // API call reference: https://platform.openai.com/docs/api-reference/assistants/listAssistants
    const assistants = await oaiClient.beta.assistants.list()
  
    // API Assistant object reference: https://platform.openai.com/docs/api-reference/assistants/object
    return assistants?.data?.find(({ metadata }) => isRecord(metadata) && metadata.repo === repo)
}

/**
 * Updates the file IDs for an existing OpenAI assistant.
 * 
 * @param {string[]} fileIDs Array of file IDs to associated with the existing OepnAI assistant.
 * @param {Assistant} assistant Existing OpenAI assistant with the 'id' field filled out
 * @returns Promise<Assistant> asdf 
 */
export async function updateAssistantFileIDs(fileIDs: string[], { id }: { id: string }): Promise<Assistant> {
    return await oaiClient.beta.assistants.update(id, { file_ids: fileIDs })
}

// An OpenAI Assistant is the logical representation of an AI assistant we have
// built for our own application - in this case Sara.
//
// Sara has instructions and can leverage models, tools, and knowledge to
// respond to any user queries she gets.
//
// The workflow to use an assistant is:
// 1. Create OpenAI Assistant object providing instructions and a model
// 2. Create a OpenAI Thread for any user initiated conversations
// 3. Add OpenAI Messages to the Thread as user asks questions
// 4. Run the Assistant on Thread to trigger responses (tooling automatically invoked)

/**
 * Configures an OpenAI assistant for use. Will identify relevant file IDs from a Git repo and
 * associate it with the OpenAI assistant. If the assistant doesn't yet exist it will create it
 * first.
 * 
 * @param {string} repo Git URL to identify relevant file IDs for
 * @returns {Promise<Assistant>} Promise with the configured OpenAI assistant
 */
export async function configAssistant(repo: string): Promise<Assistant> {
    // Get the file IDs associated with the repo first since we will end up
    // using them whether we need to create a new OpenAI assistant or there is
    // one already existing that we have its file IDs updated.
    const fileIDs = await getFileIDs(repo, DEMO_EMAIL_ADDRESS)

    const existingAssistant = await findAssistantForRepo(repo)

    if (existingAssistant) {
        return await updateAssistantFileIDs(fileIDs, existingAssistant)
    }

    return await createAssistantWithFileIDsFromRepo(fileIDs, repo)
}


# Contents of lib/hooks/use-local-storage.ts:
import { useEffect, useState } from 'react'

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState(initialValue)

  useEffect(() => {
    // Retrieve from localStorage
    const item = window.localStorage.getItem(key)
    if (item) {
      setStoredValue(JSON.parse(item))
    }
  }, [key])

  const setValue = (value: T) => {
    // Save state
    setStoredValue(value)
    // Save to localStorage
    window.localStorage.setItem(key, JSON.stringify(value))
  }
  return [storedValue, setValue]
}


