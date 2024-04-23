import { kv } from '@vercel/kv'

import { type ProjectDataSource } from './../../data-model-types'
import { projectDataSourceKey } from './keys'

const getProjectDataSource = async (projectDataSourceId: string): Promise<ProjectDataSource> => {
  const itemKey = projectDataSourceKey(projectDataSourceId)

  const projectDataSource = await kv.hgetall<ProjectDataSource>(itemKey)

  if (!projectDataSource) {
    throw new Error(`ProjectDataSource with an ID of '${projectDataSourceId}' doesn't exist`)
  }

  return projectDataSource
}

export default getProjectDataSource