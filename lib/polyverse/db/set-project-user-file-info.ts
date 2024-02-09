import { kv } from '@vercel/kv'

import { projectUserFileInfoKey } from './keys'

import { type ProjectDataReference, ProjectDataReferenceSchema } from './../../data-model-types'

const setProjectUserFileInfo = async (projectName: string, userId: string, fileInfo: ProjectDataReference): Promise<number> => {
    const validationError = ProjectDataReferenceSchema.validate(fileInfo).error

    if (validationError) {
      throw validationError
    }

    // @ts-ignore: Argument of type 'TemplateStringsArray' is not assignable to parameter of type 'string[]'.
    // Ignoring template strings shenanigans: https://github.com/microsoft/TypeScript/issues/33304
    return kv.hset(projectUserFileInfoKey`${projectName}${userId}${fileInfo.id}`, fileInfo)
}

export default setProjectUserFileInfo