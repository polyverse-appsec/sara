import Joi from 'joi'

/**
 * Template tag function that can be used to craft a Redis key in the format of:
 * task:<taskId>
 *
 * The key can be used to persist or query for tasks.
 *
 * @example
 * tasksKey`${taskId}`
 *
 * @param {string} userId String ID of a user
 * @returns Redis key that can be used to persist or query for tasks
 */
export const taskKey = (strings: string[], taskId: string): string => {
  if (Joi.string().required().validate(taskId).error) {
    throw new Error(
      `'taskId' not allowed to be blank (undefined, null, or the empty string)`,
    )
  }

  return `task:${taskId}`
}

/**
 * Template tag function that can be used to craft a Redis key in the format of:
 * user:<userId>:project:tasks:<projectName>
 *
 * The key can be used to persist or query for tasks associated with a users
 * project.
 *
 * @example
 * userTasksKey`${userId}${projectName}`
 *
 * @param {string} userId String ID of a user
 * @param {string} projectName String name of a project
 * @returns Redis key that can be used to persist or query for tasks associated
 * with a users project.
 */
export const userTasksKey = (
  strings: string[],
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
