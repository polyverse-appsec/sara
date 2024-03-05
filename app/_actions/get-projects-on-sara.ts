'use server'

import { kv } from '@vercel/kv'

import { auth } from './../../auth'
import { type Project, type User } from './../../lib/data-model-types'
import { userProjectIdsSetKey } from './../../lib/polyverse/db/keys'

export const getProjectsOnSara = async (user: User): Promise<Project[]> => {
  const session = await auth()
  console.debug(`Invoking server action: getProjectsOnSara`)

  if (
    !session?.user?.id ||
    !user ||
    !user.id ||
    !user.email ||
    user.id !== session?.user?.id
  ) {
    throw new Error('Unauthorized')
  }

  // First start by getting all of the projects associated with a user...
  const setKey = userProjectIdsSetKey(user.id)
  console.debug(`Server action - getProjectsOnSara - setKey: ${setKey}`)

  const projectKeys = (await kv.zrange(setKey, 0, -1)) as string[]
  console.debug(
    `Server action - getProjectsOnSara - projectKeys: ${JSON.stringify(
      projectKeys,
    )}`,
  )

  if (projectKeys.length === 0) {
    return []
  }

  // Then get all of the projects for the user based on the retrieved IDs...
  const projectPipeline = kv.pipeline()
  projectKeys.forEach((projectKey) => projectPipeline.hgetall(projectKey))

  const projects = (await projectPipeline.exec()) as Project[]

  console.debug(
    `Server action - getProjectsOnSara - projects: ${JSON.stringify(projects)}`,
  )

  return projects
}
