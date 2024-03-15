import { kv } from '@vercel/kv'

import { type TaskPartDeux } from './../../data-model-types'
import {
  globalTaskIdsSetKey,
  relatedChildTasksToParentGoalIdsSetKey,
  relatedChildTasksToParentTaskIdsSetKey,
  taskKey,
} from './keys'

const createTask = async (task: TaskPartDeux): Promise<void> => {
  // Verify that we have a either the parent goal ID or the parent task ID
  // set. Them being set to values are mutually exclusive events with each
  // other.
  if (task.parentGoalId === null && task.parentTaskId === null) {
    throw new Error(
      `Failed to write task to data store as neither the 'parentGoalId' or the 'parentTaskId' is set`,
    )
  }

  if (task.parentGoalId !== null && task.parentTaskId !== null) {
    throw new Error(
      `Failed to write task to data store as both the 'parentGoalId' and the 'parentTaskId' are set`,
    )
  }

  // Create the new task...
  const itemKey = taskKey(task.id)

  await kv.hset(itemKey, task)

  // Track our new task globally...
  const taskIdsSetKey = globalTaskIdsSetKey()
  await kv.zadd(taskIdsSetKey, {
    score: +new Date(),
    member: task.id,
  })

  // Track our new task in a relationship to either its parent goal or its
  // parent task
  if (task.parentGoalId !== null) {
    const relatedTasksToParentGoalIdsSetKey =
      relatedChildTasksToParentGoalIdsSetKey(task.parentGoalId)

    await kv.zadd(relatedTasksToParentGoalIdsSetKey, {
      score: +new Date(),
      member: task.id,
    })
  }

  if (task.parentTaskId !== null) {
    const relatedTasksToParentTaskIdsSetKey =
      relatedChildTasksToParentTaskIdsSetKey(task.parentTaskId)

    await kv.zadd(relatedTasksToParentTaskIdsSetKey, {
      score: +new Date(),
      member: task.id,
    })
  }
}

export default createTask
