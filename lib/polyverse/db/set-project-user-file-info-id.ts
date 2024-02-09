import Joi from 'joi'
import { kv } from '@vercel/kv'

import { projectUserFileInfoIdsSetKey, projectUserFileInfoKey } from "./keys"

const setProjectUserFileInfoId = (projectName: string, userId: string, fileInfoId: string): Promise<number | null> => {
    if (Joi.string().required().validate(fileInfoId).error) {
        throw new Error(
          `'fileInfoId' not allowed to be blank (undefined, null, or the empty string)`,
        )
    }

    // @ts-ignore: Argument of type 'TemplateStringsArray' is not assignable to parameter of type 'string[]'.
    // Ignoring template strings shenanigans: https://github.com/microsoft/TypeScript/issues/33304
    const fileInfoIdsSetKey = projectUserFileInfoIdsSetKey`${projectName}${userId}`

    // @ts-ignore: Argument of type 'TemplateStringsArray' is not assignable to parameter of type 'string[]'.
    // Ignoring template strings shenanigans: https://github.com/microsoft/TypeScript/issues/33304
    const fileInfoKey = projectUserFileInfoKey`${projectName}${userId}${fileInfoId}`

    return kv.zadd(fileInfoIdsSetKey, {
        score: +(new Date()),
        member: fileInfoKey
    })
}

export default setProjectUserFileInfoId