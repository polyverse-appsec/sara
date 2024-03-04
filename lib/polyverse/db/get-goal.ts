import { kv } from '@vercel/kv'

import { type GoalPartDeux } from './../../data-model-types'
import { goalKey } from './keys'

const getGoal = async (goalId: string): Promise<GoalPartDeux> => {
  const itemKey = goalKey(goalId)

  const goal = await kv.hgetall<GoalPartDeux>(itemKey)

  if (!goal) {
    throw new Error(`Goal with an ID of '${goalId}' doesn't exist`)
  }

  return goal
}

export default getGoal
