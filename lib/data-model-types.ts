import internal from 'stream'
import { type Message } from 'ai'
import Joi from 'joi'
import { Assistant } from 'openai/resources/beta/assistants/assistants'
import { Threads } from 'openai/resources/beta/threads/threads'

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

// TODO: Test this with a Joi schema
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

// TODO: Test this with a Joi schema
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

// TODO: Test this with a Joi schema
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

  // The last time this projects LLM was refreshed. Can mean different
  // things depending on the LLM provider. In the case of OpenAI it means
  // when we last updated its file IDs.
  lastRefreshedAt: Date
}

// TODO: Test this with a Joi schema
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

// TODO: Test this with a Joi schema
export interface GoalPartDeux extends BaseSaraObject {
  // Crucial to identity management/RBAC
  // Pertains to a billing organization (i.e. not a GitHub organization)
  orgId: string

  name: string
  description: string

  // Consider this as an extension or additional instructions to the
  // description which can be used to determine what needs to be done to
  // satisfy/complete this goal
  acceptanceCriteria: string | null

  // Right now the only status value we have defined is 'OPEN'
  status: 'OPEN'

  // Chat may not exist - only if user initiates (sans default goal).
  chatId: string | null

  parentProjectId: string

  // Considered to be all the top-level tasks that are associated with the goal
  taskIds: string[]
}

export interface TaskPartDeux extends BaseSaraObject {
  // Crucial to identity management/RBAC
  // Pertains to a billing organization (i.e. not a GitHub organization)
  orgId: string

  name: string
  description: string

  // Consider this as an extension or additional instructions to the
  // description which can be used to determine what needs to be done to
  // satisfy/complete this task
  acceptanceCriteria: string | null

  // Right now the only status value we have defined is 'OPEN'
  status: 'OPEN'

  // Chat may not exist - only if user initiates
  chatId: string | null

  // If task associated with goal then won't be null (parentTaskId will be
  // null). In other words setting the parent goal ID is a mutually exclusive
  // event with setting the parent task ID.
  parentGoalId: string | null

  // If task is a sub-task of another task then won't be null (parentGoalId
  // will be null). In other words setting the parent task ID is a mutually
  // exclusive event with setting the parent goal ID.
  parentTaskId: string | null

  // Considered to be all the sub-tasks tasks that are
  // associated with this task - always non-null even if no
  // sub-tasks (i.e. empty list)
  subTaskIds: string[]
}

// TODO: Test this with a Joi schema
export interface ChatPartDeux extends BaseSaraObject {
  // Crucial to identity management/RBAC
  // Users who can participate - or make queries - in this chat
  participatingUserIds: string[]

  // Crucial to help contextualize what prompt to give to LLM provider
  // Only one can be filled in. Never chats for both a goal and a task
  goalId: string | null
  taskId: string | null

  // Chat is essentially a linked-list
  // The ID of the first query made (oldest)
  headChatQueryId: string | null

  // The ID of the last query made (most recent)
  tailChatQueryId: string | null

  // OpenAI provider specific deatils about the thread which will be
  // used to create a run on this. If null it means thread hasn't been
  // created yet. With more data modeling work and a migration of the
  // data in the data store these details can be decoupled from the chat.
  openAiThreadId: string | null

  // OpenAI provider specific deatils about the thread run that was
  // ran on the thread ID that this instance references
  // (i.e. openAiThreadId). If null it means thread run hasn't been
  // created yet. With more data modeling work and a migration of the
  // data in the data store these details can be decoupled from the chat.
  openAiThreadRunId: string | null
}

// TODO: Test this with a Joi schema
export interface ChatQueryPartDeux extends BaseSaraObject {
  // Crucial to identity management/RBAC
  chatId: string

  // The user that sent the query to the LLM
  queryingUserId: string

  // The question asked to the LLM
  query: string

  // The answer to the asked question to the LLM
  response: string | null

  // The prompt used when the query was submitted to the LLM
  processingPrompt: string

  status: 'QUERY_RECEIVED' | 'QUERY_SUBMITTED' | 'RESPONSE_RECEIVED' | 'ERROR'

  // Empty/invalid if status not equal to 'ERROR'
  errorText: string | null

  // ISO 8601 string
  querySubmittedAt: Date

  // ISO 8601 string
  responseReceivedAt: Date | null

  // The query that was made before this query. Null if this is the first query
  // in the chat.
  prevChatQueryId: string | null

  // The query that was made after this query. Null if this is the last query
  // in the chat.
  nextChatQueryId: string | null

  // The score awarded to the quality of the response generated by the LLM.
  // Values allowed: float [0.0-1.0]
  fineTuningScore: number | null
  // ISO 8601 string
  fineTunedAt: Date | null
}

// TODO: Test
export interface PromptFileInfo extends BaseSaraObject {
  // Human semi-readable name
  name: string

  // TODO: Restrict this to string values as expected from the Boost backend
  // for GET data_references
  // The type of file info
  type: string

  // The project that depends on this file info to be injected as part of the
  // prompt passed to the LLM
  parentProjectId: string
}

// TODO: Test
export type ProjectHealthStatusValue =
  | 'UNHEALTHY'
  | 'PARTIALLY_HEALTHY'
  | 'HEALTHY'

export type ProjectHealthScalarValuesByReadableValues = {
  [readableValue in ProjectHealthStatusValue]: number
}

export const projectHealthScalarValuesByReadableValues: ProjectHealthScalarValuesByReadableValues =
  {
    UNHEALTHY: 0.0,
    PARTIALLY_HEALTHY: 0.5,
    HEALTHY: 0.0,
  }

// TODO: Test
export type ProjectHealthConfigurationState =
  | 'UNKNOWN'
  | 'VECTOR_DATA_AVAILABLE'
  | 'LLM_CREATED'
  | 'VECTOR_DATA_ATTACHED_TO_LLM'
  | 'VECTOR_DATA_UPDATE_AVAILABLE'
  | 'CONFIGURED'

export interface ProjectHealth {
  // The ID of the project that the health details are for
  projectId: string

  // Indicates the health of the project. While it allows for a range
  // of health scores most likely we will only use the following 3
  // scalar values: 0.0, 0.5, 1.0.
  //
  // A scalar value of 1.0 would denote the project is completely
  // healthy. A scalar value of 0.0 would denote the project is
  // completely unhealthy. Another way to think of the scalar values
  // is:
  // 0.0: Unhealthy
  // 0.5: Partially healthy
  // 1.0: Healthy
  //
  // A value of 0.0 would denote something that the user can't fix without the
  // help of support
  scalarValue: number
  readableValue: ProjectHealthStatusValue

  // These are different configuration states for a project that a consumer
  // of Sara would care about. Note they don't directly correlate to the
  // different states that the Boost backend could provide.
  //
  // As project configuration progresses - and possibly fails at different
  // points - these states can be provided back to the client to help guide
  // them on the experience they may receive from Sara at any given point in
  // configuration.
  configurationState: ProjectHealthConfigurationState

  // Reasoning for the current value of the health
  message: string

  // If the value of the health isn't 1.0 then this message may optionally be
  // provided to the user to allow them to take some action to help improve
  // the health
  actionableRecourse: string | null

  // ISO 8601 string
  lastCheckedAt: Date
}

// TODO: Test
export interface UserOrgStatus {
  gitHubAppInstalled: 'UNKNOWN' | 'INSTALLED'
  isPremium: 'FREE' | 'PREMIUM'
}

// TODO: Test
export interface GitHubOrg {
  login: string
  avatarUrl: string
}

// TODO: Test
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
