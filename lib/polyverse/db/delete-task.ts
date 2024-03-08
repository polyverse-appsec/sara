import { kv } from '@vercel/kv'

import {
  globalTaskIdsSetKey,
  relatedChildTasksToParentGoalIdsSetKey,
  relatedChildTasksToParentTaskIdsSetKey,
  taskKey,
} from './keys'

export interface ParentIdentifiers {
  // Remember that it is mutually exclusive that a task is associated with
  // a parent goal or a parent task. If both of these are set then it needs
  // to be considered an error.
  parentGoalId: string | null
  parentTaskId: string | null
}

const deleteTask = async (
  taskId: string,
  parentId: ParentIdentifiers,
): Promise<void> => {
  if (parentId.parentGoalId && parentId.parentTaskId) {
    throw new Error(
      `Both parent goal ID and parent task ID set when deleting task '${taskId}'`,
    )
  }

  const itemKey = taskKey(taskId)

  // Remove the tracked task from its parent goal relationship of IDs...
  if (parentId.parentGoalId) {
    const childTaskToParentGoalIdsSetKey =
      relatedChildTasksToParentGoalIdsSetKey(parentId.parentGoalId)

    await kv.zrem(childTaskToParentGoalIdsSetKey, itemKey)
  }

  // Remove the tracked task from its parent task relationship of IDs...
  if (parentId.parentTaskId) {
    const childTaskToParentTaskIdsSetKey =
      relatedChildTasksToParentTaskIdsSetKey(parentId.parentTaskId)

    await kv.zrem(childTaskToParentTaskIdsSetKey, itemKey)

    // In theory this method can be called recursively if need be on a set
    // of tasks. In supporting that check if the parent task relationship
    // set of IDs has any task IDs left in it. If it doesn't then just
    // delete it. Note that we don't need to do this check in this function
    // when deleting from a parent goal relationship as the responsiblity of
    // deleting that set is delegated to the logic that actually deletes the
    // parent goal.
    const childTaskIds = (await kv.zrange(
      childTaskToParentTaskIdsSetKey,
      0,
      -1,
    )) as string[]

    if (childTaskIds.length === 0) {
      await kv.del(childTaskToParentTaskIdsSetKey)
    }
  }

  // Remove the tracked task from our global set of task IDs...
  const taskIdsSetKey = globalTaskIdsSetKey()
  await kv.zrem(taskIdsSetKey, itemKey)

  // Delete the task instance...
  await kv.del(itemKey)
}

export default deleteTask
