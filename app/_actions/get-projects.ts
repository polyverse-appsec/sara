'use server'

import { auth } from './../../auth'
import { type Project, type User } from './../../lib/data-model-types'
import { getProjectsOnBoost } from './get-projects-on-boost'
import { getProjectsOnSara } from './get-projects-on-sara'



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

  // Start by getting the projects from the Boost service
  const boostProjects = await getProjectsOnBoost(orgId, user)

  // Then get the projects from the Sara service
  const saraProjects = await getProjectsOnSara(user)
 
  return saraProjects
}
