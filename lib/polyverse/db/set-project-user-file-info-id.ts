import Joi from 'joi'
import { kv } from '@vercel/kv'

import { projectUserFileInfoIdsSetKey, projectUserFileInfoKey } from "./keys"

const setProjectUserFileInfoId = (projectName: string, userId: string, fileInfoId: string): Promise<number | null> => {
    if (Joi.string().required().validate(fileInfoId).error) {
        throw new Error(
          `'fileInfoId' not allowed to be blank (undefined, null, or the empty string)`,
        )
    }

    const fileInfoIdsSetKey = projectUserFileInfoIdsSetKey(projectName, userId)
    const fileInfoKey = projectUserFileInfoKey(projectName, userId, fileInfoId)

    return kv.zadd(fileInfoIdsSetKey, {
        score: +(new Date()),
        member: fileInfoKey
    })
}

export default setProjectUserFileInfoId