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

  // Start by getting the projects from the Boost service. Based on org and user
  const boostProjects = await getProjectsOnBoost(orgId, user)

  // Then get the projects from the Sara service (Returns all projects regardless of org! it's based on user)
  const saraProjects = await getProjectsOnSara(user)

  // Map saraProjects properties to boostProjects based on the 'name' field
  console.debug(
    `Server action getProjects - about to map the following JS object/array 'boostProjects': ${JSON.stringify(
      boostProjects,
    )}`,
  )

  const mappedProjects = boostProjects.map((boostProject) => {
    // Find the corresponding saraProject
    const correspondingSaraProject = saraProjects.find(
      (saraProject) => saraProject.name === boostProject.name,
    )

    // If a corresponding saraProject exists, merge its properties into the boostProject
    if (correspondingSaraProject) {
      // This uses the spread operator to merge properties, giving precedence to saraProject properties
      // Adjust this logic if you need to handle arrays or nested objects differently
      return { ...boostProject, ...correspondingSaraProject }
    }

    // If there's no corresponding saraProject, return the original boostProject
    return boostProject
  })

  return mappedProjects
}
