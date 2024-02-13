import { kv } from '@vercel/kv'

import { projectUserFileInfoKey } from './keys'

import { type ProjectDataReference, ProjectDataReferenceSchema } from './../../data-model-types'

const setProjectUserFileInfo = async (projectName: string, userId: string, fileInfo: ProjectDataReference): Promise<number> => {
    const validationError = ProjectDataReferenceSchema.validate(fileInfo).error

    if (validationError) {
      throw validationError
    }

    const key = projectUserFileInfoKey(projectName, userId, fileInfo.id)
    return kv.hset(key, fileInfo)
}

export default setProjectUserFileInfo