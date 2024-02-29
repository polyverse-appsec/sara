import { kv } from '@vercel/kv'

import { type ProjectDataSource } from './../../data-model-types'
import { globalProjectDataSourceIdsSetKey, projectDataSourceKey } from './keys'

const createProjectDataSource = async (projectDataSource: ProjectDataSource): Promise<void> => {
  // Create the new project data source...
  const itemKey = projectDataSourceKey(projectDataSource.id)

  await kv.hset(itemKey, projectDataSource)

  // Track our new project data source globally...
  const projectDataSourceIdsSetKey = globalProjectDataSourceIdsSetKey()
  await kv.zadd(projectDataSourceIdsSetKey, {
    score: +new Date(),
    member: projectDataSource.id,
  })
}

export default createProjectDataSource
