import Joi, { boolean } from 'joi'
import { BoostProjectStatusState } from 'lib/polyverse/backend/types/BoostProjectStatus'

////////////////////////////
// Core Sara Types - Start
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

export interface Chatable extends BaseSaraObject {
  // Chat may not exist - only if user initiates (sans default goal).
  chatId: string | null
}

// TODO: Test this with a Joi schema
export interface User extends BaseSaraObject {
  // Crucial to identity management/RBAC
  email: string

  // Identifies all the billing contexts a user belongs to
  orgIds: string[]

  // Some human readable name
  username: string

  lastSignedInAt: Date

  // Flag to denote if the user is on the waitlist and can access Sara yet. If
  // set to 'true' user will be re-directed to some waiting page.
  waitlisted: boolean
}

// TODO: Rename this as BillingOrg
// TODO: Test this with a Joi schema
export interface Org extends BaseSaraObject {
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
export interface Project extends BaseSaraObject {
  // Crucial to identity management/RBAC.
  // Pertains to a billing context (i.e. not a GitHub organization)
  orgId: string

  // Identifies which users have access to read/write this project
  // and all goals/tasks that fall under it
  userIds: string[]

  name: string
  description: string

  projectDataSourceIds: string[]

  // List of strings that can be used to help configure the way responses are
  // provided from the LLM. For example: 'Give your answers in Spanish'
  guidelines: string[]

  // Will always be populated with at least one goal which is
  // the default "Learn More About Project" goal
  goalIds: string[]

  // The last time this projects LLM was refreshed. Can mean different
  // things depending on the LLM provider. In the case of OpenAI it means
  // when we last updated its file IDs.
  lastRefreshedAt: Date
}

export enum ProjectDataSourceAccessPermission {
  // User read-only to source
  PRIMARY_READ = 'PRIMARY_READ',

  // User read/write to source
  PRIMARY_READ_WRITE = 'PRIMARY_READ_WRITE',

  // User read-only to reference
  REFERENCE_READ = 'REFERENCE_READ',
}

type ProjectDataSourceAccessPermissionString =
  keyof typeof ProjectDataSourceAccessPermission

enum ProjectDataSourceVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  UNKNOWN = 'UNKNOWN',
  ERROR = 'ERROR',
}

type ProjectDataSourceVisibilityString =
  keyof typeof ProjectDataSourceVisibility

// TODO: Test this with a Joi schema
// TODO: This type differs from `ProjectDataReference` right now as
// `ProjectDataReference` represents the return values from
// `GET /user_project/billingOrgId/projectName/data_references`. They should
// probably be collapsed into each other in the future though.
export interface ProjectDataSource extends BaseSaraObject {
  // What project the source is associated with. Projects
  // themselves maintain what are primary/secondary data sources.
  parentProjectId: string

  // Represents where the source may be fetched from. May not
  // be fetchable immediately due to access controls put in place
  // by those that maintain/house the source.
  uri: string

  // The permissions granted for this project data source when
  // trying to access it
  accessPermission: ProjectDataSourceAccessPermissionString

  // The visibility of the project data source to others
  visibility: ProjectDataSourceVisibilityString
}

// TODO: Test this with a Joi schema
export interface Goal extends Chatable {
  // Crucial to identity management/RBAC
  // Pertains to a billing context (i.e. not a GitHub organization)
  orgId: string

  name: string
  description: string

  // Consider this as an extension or additional instructions to the
  // description which can be used to determine what needs to be done to
  // satisfy/complete this goal
  acceptanceCriteria: string | null

  // Right now the only status value we have defined is 'OPEN'
  status: 'OPEN'

  parentProjectId: string

  // Considered to be all the top-level tasks that are associated with the goal
  taskIds: string[]
}

export interface Task extends Chatable {
  // Crucial to identity management/RBAC
  // Pertains to a billing context (i.e. not a GitHub organization)
  orgId: string

  name: string
  description: string

  // Consider this as an extension or additional instructions to the
  // description which can be used to determine what needs to be done to
  // satisfy/complete this task
  acceptanceCriteria: string | null

  // Right now the only status value we have defined is 'OPEN'
  status: 'OPEN'

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
export interface Chat extends BaseSaraObject {
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

export type ChatQueryStatus = 'QUERY_RECEIVED' | 'QUERY_SUBMITTED' | 'RESPONSE_RECEIVED' | 'ERROR'

// TODO: Test this with a Joi schema
export interface ChatQuery extends BaseSaraObject {
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

  status: ChatQueryStatus

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
export enum PromptFileInfoType {
  ProjectSpecification = 'aispec',
  ArchitecturalBlueprint = 'blueprint',
  ProjectSource = 'projectsource',
}

export type PromptFileInfoTypeString = keyof typeof PromptFileInfoType

// TODO: Test
export interface PromptFileInfo extends BaseSaraObject {
  // Human semi-readable name
  name: string

  // for GET data_references
  // The type of file info
  type: PromptFileInfoTypeString

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

  // The status of the project's background project proessing, source
  //        retrieval and AI file synchronization
  backgroundProjectStatus: BoostProjectStatusState | undefined

  // ISO 8601 string
  lastCheckedAt: Date
}

////////////////////////////
// Core Sara Types - End
////////////////////////////

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
  private: boolean
}

export const ProjectFileInfoSchema = Joi.object({
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
