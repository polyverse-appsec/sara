'use server'

import { auth } from './../../auth'
import { type Project, type User } from './../../lib/data-model-types'
import { getUserProjects } from './../../lib/polyverse/backend/backend'

export const getProjects = async (
  orgId: string,
  user: User,
): Promise<Project[]> => {
  const session = await auth()

  if (
    !session?.user?.id ||
    !user ||
    !user.id ||
    !user.email ||
    user.id !== session?.user?.id
  ) {
    throw new Error('Unauthorized')
  }

  return await getUserProjects(orgId, user.email)
}
