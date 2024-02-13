import Joi from 'joi'

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
export const projectUserFileInfoIdsSetKey = (projectName: string, userId: string): string => {
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
export const projectUserFileInfoKey = (projectName: string, userId: string, fileInfoId: string) => {
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
 * task:<taskId>
 *
 * The key can be used to persist or query for tasks.
 *
 * @example
 * tasksKey(taskId)
 *
 * @param {string} userId String ID of a user
 * @returns Redis key that can be used to persist or query for tasks
 */
export const taskKey = (taskId: string): string => {
  if (Joi.string().required().validate(taskId).error) {
    throw new Error(
      `'taskId' not allowed to be blank (undefined, null, or the empty string)`,
    )
  }

  return `task:${taskId}`
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
export const userTasksKey = (
  userId: string,
  projectName: string,
): string => {
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
