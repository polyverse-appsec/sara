import { kv } from '@vercel/kv'

import { globalGoalIdsSetKey, goalKey } from './keys'

const deleteGoal = async (goalId: string): Promise<void> => {
  const itemKey = goalKey(goalId)

  // Remove the tracked goal from our global set of goal IDs...
  const goalIdsSetKey = globalGoalIdsSetKey()
  await kv.zrem(goalIdsSetKey, itemKey)

  // Delete the goal instance...
  await kv.del(itemKey)
}

export default deleteGoal
