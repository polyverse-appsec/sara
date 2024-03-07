import { kv } from '@vercel/kv'

import { globalGoalIdsSetKey, goalKey, relatedChildTasksToParentGoalIdsSetKey } from './../../../lib/polyverse/db/keys'
import deleteTask from './../../../lib/polyverse/db/delete-task'

const deleteGoal = async (goalId: string): Promise<void> => {
  // Since there is a relationship set of IDs for tasks associated with the
  // goal start by deleting those...
  const childTasksToParentGoalIdsSetKey =
    relatedChildTasksToParentGoalIdsSetKey(goalId)

  const childTaskIds = (await kv.zrange(
    childTasksToParentGoalIdsSetKey,
    0,
    -1,
  )) as string[]

  const deleteChildTaskPromises = childTaskIds.map(
    (childTaskId) => deleteTask(childTaskId, {
      parentGoalId: goalId,
      parentTaskId: null
    })
  )

  await Promise.all(deleteChildTaskPromises)

  // Now just delete the relationship set...
  await kv.del(childTasksToParentGoalIdsSetKey)

  const itemKey = goalKey(goalId)

  // Remove the tracked goal from our global set of goal IDs...
  const goalIdsSetKey = globalGoalIdsSetKey()
  await kv.zrem(goalIdsSetKey, itemKey)

  // Delete the goal instance...
  await kv.del(itemKey)
}

export default deleteGoal
