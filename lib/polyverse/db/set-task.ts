import { kv } from '@vercel/kv'

import { TaskSchema, type Task } from './../../../lib/data-model-types'
import { taskKey } from './keys'

/**
 * Sets a hash of a task in a Redis DB after performing validation on it.
 * Validation ensures that the object is in the correct shape and that there
 * aren't any `null`/`undefined` values on it. Should validation fail it throws
 * an error.
 *
 * @param {Task} task The task to hash.
 * @returns {Promise<void>} Returns a promise that on success will resolve to
 * `void`.
 */
const setTask = async (task: Task): Promise<void> => {
  const validationError = TaskSchema.validate(task).error

  if (validationError) {
    throw validationError
  }

  // @ts-ignore Ignoring template strings shenanigans: https://github.com/microsoft/TypeScript/issues/33304
  await kv.hset(taskKey`${task.id}`, task)
}

export default setTask
