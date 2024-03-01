import { kv } from '@vercel/kv'

import { globalProjectIdsSetKey, projectKey } from './keys'

const deleteProject = async (projectId: string): Promise<void> => {
    const itemKey = projectKey(projectId)

    // Remove the tracked project from our global set of project IDs...
    const projectIdsSetKey = globalProjectIdsSetKey()
    await kv.zrem(projectIdsSetKey, itemKey)

    // Delete the project instance...
    await kv.del(itemKey)
}

export default deleteProject