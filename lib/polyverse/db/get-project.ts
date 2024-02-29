import { kv } from '@vercel/kv'

import { type ProjectPartDeux } from './../../data-model-types'
import { projectKey } from './keys'

// TODO: Have to temporarily rename as `getProjectDb` as we have an action named `getProject`
const getProjectDb = async (projectId: string): Promise<ProjectPartDeux> => {
  const itemKey = projectKey(projectId)

  const project = await kv.hgetall<ProjectPartDeux>(itemKey)

  if (!project) {
    throw new Error(`Project with an ID of '${projectId}' doesn't exist`)
  }

  return project
}

export default getProjectDb
