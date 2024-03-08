import Joi from 'joi'

///////////////////////////
// Global Key Sets
///////////////////////////

// TODO: Test
export const globalChatIdsSetKey = () => `global:chat:ids`

// TODO: Test
export const globalChatQueryIdsSetKey = () => `global:chat-query:ids`

// TODO: Test
export const globalPromptFileInfoIdsSetKey = () => `global:prompt-file-info:ids`

// TODO: Test
export const globalGoalIdsSetKey = () => `global:goal:ids`

// TOOD: Test
export const globalOrgIdsSetKey = () => `global:org:ids`

// TODO: Test
export const globalProjectIdsSetKey = () => `global:project:ids`

// TODO: Test
export const globalProjectDataSourceIdsSetKey = () =>
  `global:project-data-source:ids`

export const globalTaskIdsSetKey = () => `global:task:ids`

// TODO: Test
export const globalUserEmailsSetKey = () => `global:user:emails`

///////////////////////////
// Relationship Key Sets
///////////////////////////

// TODO: Test
export const relatedChatQueriesToChatIdsSetKey = (chatId: string) =>
  `chat:${chatId}:chat-query:ids`

// TODO: Test
export const relatedPromptFileInfosToProjectIdsSetKey = (projectId: string) =>
  `project:${projectId}:prompt-file-info:ids`

// TODO: Test
export const relatedChildTasksToParentGoalIdsSetKey = (parentGoalId: string) =>
  `parent-goal:${parentGoalId}:child-task:ids`

// TODO: Test
export const relatedChildTasksToParentTaskIdsSetKey = (parentTaskId: string) =>
  `parent-task:${parentTaskId}:child-task:ids`

///////////////////////////
// Instance Keys
///////////////////////////

// TODO: Test
export const chatKey = (chatId: string) => `chat:${chatId}`

// TODO: Test
export const chatQueryKey = (chatQueryId: string) => `chat-query:${chatQueryId}`

// TODO: Test
export const promptFileInfoKey = (fileInfoId: string) =>
  `prompt-file-info:${fileInfoId}`

// TODO: Test
export const goalKey = (goalId: string) => `goal:${goalId}`

// TODO: Test
export const orgKey = (orgId: string) => `org:${orgId}`

// TODO: Test
export const projectKey = (projectId: string) => `project:${projectId}`

// TODO: Test
export const projectDataSourceKey = (projectDataSourceId: string) =>
  `project-data-source:${projectDataSourceId}`

export const taskKey = (taskId: string): string => {
  if (Joi.string().required().validate(taskId).error) {
    throw new Error(
      `'taskId' not allowed to be blank (undefined, null, or the empty string)`,
    )
  }

  return `task:${taskId}`
}

// TODO: Test
export const userKey = (email: string) => `user:${email}`

////////////////////////////////////////////
// Old keys used in old data model
////////////////////////////////////////////

// TODO: Consider if I want the pattern of `user:${userId}:project:${projectId}`
// or `project:${projectId}:user:${userId}` as right now I use both patterns

// TODO: Test
export const userProjectKey = (userId: string, projectId: string) =>
  `user:${userId}:project:${projectId}`

// TODO: Test
export const userProjectIdsSetKey = (userId: string) =>
  `user:${userId}:projectIds`

/**
 * Function that can be used to craft a Redis key in the format of:
 * project:<projectName>:user:<userId>:fileInfoIds
 *
 * The key can be used to persist or query for a set of file info IDs associated
 * with a users project.
 *
 * @example
 * projectUserFilesKey(projectName, userId)
 *
 * @param {string} projectName String name of a project
 * @param {string} userId String ID of a user
 * @returns Redis key that can be used to persist or query for a set of file IDs
 * associated with a users project.
 */
export const projectUserFileInfoIdsSetKey = (
  projectName: string,
  userId: string,
): string => {
  // TODO: This needs to have `projectName` updated to `projectId` I beleive.
  // And all other keys that use the notion of `projectName`.

  if (Joi.string().required().validate(projectName).error) {
    throw new Error(
      `'projectName' not allowed to be blank (undefined, null, or the empty string)`,
    )
  }

  if (Joi.string().required().validate(userId).error) {
    throw new Error(
      `'userId' not allowed to be blank (undefined, null, or the empty string)`,
    )
  }

  return `project:${projectName}:user:${userId}:fileInfoIds`
}

/**
 * Function that can be used to craft a Redis key in the format of:
 * project:<projectName>:user:<userId>:fileInfo:<fileInfoId>
 *
 * The key can be used to persist or query for file info associated with a
 * users project.
 *
 * @example
 * projectUserFileInfoKey(projectName, userId, fileInfoId)
 *
 * @param {string} projectName String name of a project
 * @param {string} userId String ID of a user
 * @param {string} fileInfoId ID of a file as returned from the Boost backend
 * @returns Redis key that can be used to persist or query for file info\
 * associated with a users project.
 */
export const projectUserFileInfoKey = (
  projectName: string,
  userId: string,
  fileInfoId: string,
) => {
  if (Joi.string().required().validate(projectName).error) {
    throw new Error(
      `'projectName' not allowed to be blank (undefined, null, or the empty string)`,
    )
  }

  if (Joi.string().required().validate(userId).error) {
    throw new Error(
      `'userId' not allowed to be blank (undefined, null, or the empty string)`,
    )
  }

  if (Joi.string().required().validate(fileInfoId).error) {
    throw new Error(
      `'fileId' not allowed to be blank (undefined, null, or the empty string)`,
    )
  }

  return `project:${projectName}:user:${userId}:fileInfo:${fileInfoId}`
}

/**
 * Function that can be used to craft a Redis key in the format of:
 * user:<userId>:project:tasks:<projectName>
 *
 * The key can be used to persist or query for tasks associated with a users
 * project.
 *
 * @example
 * userTasksKey(userId, projectName)
 *
 * @param {string} userId String ID of a user
 * @param {string} projectName String name of a project
 * @returns Redis key that can be used to persist or query for tasks associated
 * with a users project.
 */
export const userTasksKey = (userId: string, projectName: string): string => {
  if (Joi.string().required().validate(userId).error) {
    throw new Error(
      `'userId' not allowed to be blank (undefined, null, or the empty string)`,
    )
  }

  if (Joi.string().required().validate(projectName).error) {
    throw new Error(
      `'projectName' not allowed to be blank (undefined, null, or the empty string)`,
    )
  }

  return `user:${userId}:project:tasks:${projectName}`
}
