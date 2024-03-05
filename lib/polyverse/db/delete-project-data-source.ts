import { kv } from '@vercel/kv'

import { globalProjectDataSourceIdsSetKey, projectDataSourceKey } from './keys'

const deleteProjectDataSource = async (
  projectDataSourceId: string,
): Promise<void> => {
  const itemKey = projectDataSourceKey(projectDataSourceId)

  // Remove the tracked project data source from our global set of goal IDs...
  const projectDataSourceIdsSetKey = globalProjectDataSourceIdsSetKey()
  await kv.zrem(projectDataSourceIdsSetKey, itemKey)

  // Delete the project data source...
  await kv.del(itemKey)
}

export default deleteProjectDataSource
