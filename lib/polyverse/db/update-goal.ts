import { kv } from '@vercel/kv'

import { type GoalPartDeux } from './../../data-model-types'
import { goalKey } from './keys'

const updateGoal = async (goal: GoalPartDeux): Promise<void> => {
  const itemKey = goalKey(goal.id)

  // TODO: DRY up this logic across all update functions
  goal.lastUpdatedAt = new Date()

  await kv.hset(itemKey, goal)
}

export default updateGoal
