import { type Message } from 'ai'
import Joi from 'joi'
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

*/

////////////////////////////
// Refined Data Model Start
////////////////////////////

export const BaseSaraObjectSchema = Joi.object({
  id: Joi.string().required(),
  createdAt: Joi.date()
    .timestamp(`javascript`)
    .min(`2023-12-25T00:00:00.000Z`)
    .max(`now`)
    .required(),
  lastUpdatedAt: Joi.date()
    .timestamp(`javascript`)
    .min(Joi.ref('createdAt'))
    .max(`now`)
    .required(),
})

export interface BaseSaraObject extends Record<string, any> {
  // Crucial to identity management/RBAC
  id: string

  // ISO 8601 string
  createdAt: Date

  // ISO 8601 string
  lastUpdatedAt: Date
}

// TODO: Test this
// TODO: Note we called this interface `UserPartDeux` while we iterate on
// the data model design and the UX/UI. We preserve the original `User`
// interface for now until we have fully implemented enough details about
// the user to cut over in which case we will delete `User`.
export interface UserPartDeux extends BaseSaraObject {
  // Crucial to identity management/RBAC
  email: string

  // Identifies all the billing organizations a user belongs to
  orgIds: string[]

  // Some human readable name
  username: string

  lastSignedInAt: Date
}

// TODO: Test this
// TODO: Note we called this interface `OrgPartDeux` while we iterate on
// the data model design and the UX/UI. We preserve the original `Org`
// interface for now until we have fully implemented enough details about
// the org to cut over in which case we will delete `Org`.
export interface OrgPartDeux extends BaseSaraObject {
  // Crucial to identity management/RBAC
  // Identifies all users within the organization
  userIds: string[]

  name: string

  // Which projects are associated with an organization. Doesn't indicate
  // grants to users to access those projects. That is determined on the
  // project itself.
  projectIds: string[]
}

// TODO: Test this
// TODO: Note we called this interface `ProjectPartDeux` while we iterate on
// the data model design and the UX/UI. We preserve the original `Project`
// interface for now until we have fully implemented enough details about
// the project to cut over in which case we will delete `Project`.
export interface ProjectPartDeux extends BaseSaraObject {
  // Crucial to identity management/RBAC.
  // Pertains to a billing organization (i.e. not a GitHub organization)
  orgId: string

  // Identifies which users have access to read/write this project
  // and all goals/tasks that fall under it
  userIds: string[]

  name: string
  description: string

  projectDataSourceIds: string[]

  // Will always be populated with at least one goal which is
  // the default "Learn More About Project" goal
  goalIds: string[]
}

// TODO: This type differs from `ProjectDataReference` right now as
// `ProjectDataReference` represents the return values from
// `GET /user_project/billingOrgId/projectName/data_references`. They should
// probably be collapsed into each other in the future though.
export interface ProjectDataSourcePartDeux extends BaseSaraObject {
  // What project the source is associated with. Projects
  // themselves maintain what are primary/secondary data sources.
  parentProjectId: string

  // Represents where the source may be fetched from. May not
  // be fetchable immediately due to access controls put in place
  // by those that maintain/house the source.
  sourceUrl: string
}

export interface GoalPartDeux extends BaseSaraObject {
  // Crucial to identity management/RBAC
  // Pertains to a billing organization (i.e. not a GitHub organization)
  orgId: string

  name: string
  description: string

  // Chat may not exist - only if user initiates (sans default goal).
  chatId: string

  parentProjectId: string

  // Considered to be all the top-level tasks that are associated with the goal
  taskIds: string[]
}

export interface GitHubOrg {
  login: string
  avatarUrl: string
}

export interface GitHubRepo {
  name: string
  htmlUrl: string
}

////////////////////////////
// Refined Data Model End
////////////////////////////

export const GoalSchema = BaseSaraObjectSchema.keys({
  orgId: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  status: Joi.string(),
  chatId: Joi.string(),
  parentProjectId: Joi.string().required(),
  taskIds: Joi.array().items(Joi.string()),
  closedAt: Joi.date()
    .timestamp(`javascript`)
    .min(Joi.ref('lastUpdatedAt'))
    .max(`now`),
})

export interface Goal extends BaseSaraObject {
  // Crucial to identity management/RBAC
  orgId: string

  title: string
  description: string

  // TODO: Define some status oriented around goals
  // e.g. 'OPEN', 'IN_PROGRESS', ...
  status: string | null

  // Chats are user initiated (except for the default one assigned to each
  // project) and will be `null` to indicate it hasn't been initiated.
  chatId: string

  parentProjectId: string

  // Considered to be all the top-level tasks that are associated with the
  // goal. Empty array indicates there are no tasks yet.
  taskIds: string[]

  // ISO 8601 string
  closedAt: Date
}

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
  mainRepository: Repository
  referenceRepositories?: Repository[]
  tasks?: Task[]
  defaultTask?: Task
  assistant?: Assistant
  lastSynchronizedAt: Date
}

export const TaskSchema = Joi.object({
  // TODO: Add a format to the ID that must be matched
  id: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  createdAt: Joi.date()
    .timestamp(`javascript`)
    .min(`2023-12-25T00:00:00.000Z`)
    .max(`now`)
    .required(),
  userId: Joi.string().required(),
  projectId: Joi.string().required(),
  // TODO: Add items to chats array that is representative of a chat
  chats: Joi.array(),
  subtasks: Joi.array().items(Joi.link(`#task`)),
})
  .unknown(false)
  .id(`task`)

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

// TODO: Change name to ProjectFileInfoSchema
export const ProjectDataReferenceSchema = Joi.object({
  // TODO: Should we add a format to the name that must be matched?
  name: Joi.string().required(),
  // TODO: Restrict these to a specific amount of types
  type: Joi.string().required(),
  // TODO: Should we add a format to the name that must be matched?
  id: Joi.string().required(),
  lastUpdatedAt: Joi.date()
    .timestamp(`javascript`)
    .min(`2023-12-25T00:00:00.000Z`)
    .max(`now`)
    .required(),
})

// TODO: Change name to ProjectFileInfo
export interface ProjectDataReference extends Record<string, any> {
  name: string
  type: string
  id: string
  lastUpdatedAt: Date
}
