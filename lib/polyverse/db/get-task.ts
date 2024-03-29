import { kv } from '@vercel/kv'

import { type Task } from './../../data-model-types'
import { taskKey } from './keys'

const getTask = async (taskId: string): Promise<Task> => {
  const itemKey = taskKey(taskId)

  const task = await kv.hgetall<Task>(itemKey)

  if (!task) {
    throw new Error(`Task with an ID of '${taskId}' doesn't exist`)
  }

  return task
}

export default getTask
