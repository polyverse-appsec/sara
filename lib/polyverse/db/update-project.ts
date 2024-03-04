import { kv } from '@vercel/kv'

import { type ProjectPartDeux } from './../../data-model-types'
import { projectKey } from './keys'

const updateProject = async (project: ProjectPartDeux): Promise<void> => {
  const itemKey = projectKey(project.id)

  project.lastUpdatedAt = new Date()

  await kv.hset(itemKey, project)
}

export default updateProject
