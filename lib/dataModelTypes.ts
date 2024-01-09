import { type Message } from 'ai'
import { Assistant } from 'openai/resources/beta/assistants/assistants'
import { Threads } from 'openai/resources/beta/threads/threads'

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

export interface Project extends Record<string, any> {
  full_name: string // the full_name doubles as the id. we do not have a seperate id so we can easily look up by name.
  html_url: string
  name: string
  description: string
  orgId: string
  referenceRepositories?: {
    organization: string
    repository: string
  }[]
  tasks?: Task[]
  defaultTask?: Task
  assistant?: Assistant
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
  repoId?: string
  thread?: Threads.Thread
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>
export interface ProjectDataReference {
  name: string
  type: string
  id: string
  last_updated: number
}
