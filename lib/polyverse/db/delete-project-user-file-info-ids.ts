import { kv } from '@vercel/kv'

import { projectUserFileInfoIdsSetKey } from './keys'

const deleteProjectUserFileInfoIds = (projectName: string, userId: string): Promise<number> => {
    const fileInfoIdsSetKey = projectUserFileInfoIdsSetKey(projectName, userId)

    return kv.del(fileInfoIdsSetKey)
}

export default deleteProjectUserFileInfoIds