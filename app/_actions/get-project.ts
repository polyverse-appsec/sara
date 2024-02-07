'use server'

import { kv } from '@vercel/kv'

import { auth } from './../../auth'
import { type Project } from './../../lib/data-model-types'

export async function getProject(projectKey: string): Promise<Project | null> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const project = await kv.hgetall<Project>(projectKey)

  if (!project) {
    return null
  }

  return project
}
