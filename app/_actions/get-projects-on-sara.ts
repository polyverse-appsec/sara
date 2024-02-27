'use server'

import { kv } from '@vercel/kv'

import { auth } from './../../auth'
import { type Project, type User } from './../../lib/data-model-types'
import { userProjectIdsSetKey } from './../../lib/polyverse/db/keys'

export const getProjectsOnSara = async (user: User): Promise<Project[]> => {
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

  // First start by getting all of the projects associated with a user...
  const setKey = userProjectIdsSetKey(user.id)
  const projectKeys = (await kv.zrange(setKey, 0, -1)) as string[]

  if (projectKeys.length === 0) {
    return []
  }

  // Then get all of the projects for the user based on the retrieved IDs...
  const projectPipeline = kv.pipeline()
  projectKeys.forEach((projectKey) => projectPipeline.hgetall(projectKey))

  const projects = (await projectPipeline.exec()) as Project[]

  return projects
}
