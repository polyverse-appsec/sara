import { kv } from '@vercel/kv'

import { projectUserFileInfoIdsSetKey } from './keys'

const deleteProjectUserFileInfoIds = (projectName: string, userId: string): Promise<number> => {
    // @ts-ignore: Argument of type 'TemplateStringsArray' is not assignable to parameter of type 'string[]'.
    // Ignoring template strings shenanigans: https://github.com/microsoft/TypeScript/issues/33304
    const fileInfoIdsSetKey = projectUserFileInfoIdsSetKey`${projectName}${userId}`

    return kv.del(fileInfoIdsSetKey)
}

export default deleteProjectUserFileInfoIds