import { kv } from '@vercel/kv'

import { type Goal } from './../../data-model-types'
import { globalGoalIdsSetKey, goalKey } from './keys'

const createGoal = async (goal: Goal): Promise<void> => {
  // Create the new goal...
  const itemKey = goalKey(goal.id)

  await kv.hset(itemKey, goal)

  // Track our new goal globally...
  const goalIdsSetKey = globalGoalIdsSetKey()
  await kv.zadd(goalIdsSetKey, {
    score: +new Date(),
    member: goal.id,
  })
}

export default createGoal
