import { kv } from '@vercel/kv'

import { type Goal } from './../../data-model-types'
import { goalKey } from './keys'

const updateGoal = async (goal: Goal): Promise<void> => {
  const itemKey = goalKey(goal.id)

  // TODO: DRY up this logic across all update functions
  goal.lastUpdatedAt = new Date()

  await kv.hset(itemKey, goal)
}

export default updateGoal
