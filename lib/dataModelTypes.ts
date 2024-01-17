import { type Message } from 'ai'
import { Assistant } from 'openai/resources/beta/assistants/assistants'
import { Threads } from 'openai/resources/beta/threads/threads'

/*
 ** Sara data model **

We have a user, represented by a github id. We store additional information about the user,
such as their email address.

The principal object is a project.  a project consists of a set of repositories.

Each user has a set of projects that they have access to. The ids of these repositories is stored in an array off of the user object.

Each project object is stored in a KV namespace called `project:${projectid}`. Note that the id is *per user*. I.e. in a team
environment, each user will have their own repository object to hang on to their own specific chats (which are not shared by default)

Each repository has a set of reference repositories. This is stored in the data fields of the repository object

A project has a set of tasks. The ids of these tasks is stored in a sorted set called `project:tasks:${repoId}`.

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
  projectIds?: string[]
  lastActiveProjectId: string
}

// Define the simplified Organization type
export type Organization = {
  login: string // The organization's login name
  avatar_url: string // The URL of the organization's avatar
}

export interface Repository extends Record<string, any> {
  id: string
  userId: string
  name: string
  full_name: string
  html_url: string
  description: string
  organization: Organization
  image?: string
}
export interface Project extends Record<string, any> {
  id: string
  name: string
  description: string
  userId: string
  mainRepositoryId: string
  referenceRepositoriesIds?: string[]
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
  projectId: string
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
  projectId?: string
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
