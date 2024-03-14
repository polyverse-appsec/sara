import { kv } from '@vercel/kv'

import { globalProjectDataSourceIdsSetKey, projectDataSourceKey } from './keys'

const deleteProjectDataSource = async (
  projectDataSourceId: string,
): Promise<void> => {
  // Remove the tracked project data source from our global set of goal IDs...
  const projectDataSourceIdsSetKey = globalProjectDataSourceIdsSetKey()
  await kv.zrem(projectDataSourceIdsSetKey, projectDataSourceId)

  // Delete the project data source...
  const itemKey = projectDataSourceKey(projectDataSourceId)
  await kv.del(itemKey)
}

export default deleteProjectDataSource
