import { kv } from '@vercel/kv'

import { type Project } from './../../data-model-types'
import { projectKey } from './keys'

const updateProject = async (project: Project): Promise<void> => {
  const itemKey = projectKey(project.id)

  project.lastUpdatedAt = new Date()

  await kv.hset(itemKey, project)
}

export default updateProject
