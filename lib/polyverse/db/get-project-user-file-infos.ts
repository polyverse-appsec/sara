import { kv } from '@vercel/kv'
import Joi from 'joi'

import { ProjectDataReference } from './../../../lib/data-model-types'

const getProjectUserFileInfos = async (projectName: string, userId: string, fileInfoKeys: string[]): Promise<ProjectDataReference[]> => {
    if (Joi.array().validate(fileInfoKeys).error) {
        throw new Error(`'fileInfoIds' must be an array`)
    }

    if (fileInfoKeys.length
        && Joi.array().items(Joi.string().required()).validate(fileInfoKeys).error)
    {
        throw new Error(`The contents of 'fileInfoIds' must be strings that aren't blank (undefined, null, or the empty string)`)
    }

    // If we don't have a length then return early here as the Redis pipelines
    // don't like being empty when we execute them
    if (!fileInfoKeys.length) {
        return [] as ProjectDataReference[]
    }

    const pipeline = kv.pipeline()

    fileInfoKeys.forEach((fileInfoKey) => {
        pipeline.hgetall(fileInfoKey)
    })

    const fileInfos = await pipeline.exec()

    return fileInfos as ProjectDataReference[]
}

export default getProjectUserFileInfos