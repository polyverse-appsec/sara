import { kv } from '@vercel/kv'

import {
  ProjectDataReferenceSchema,
  type ProjectDataReference,
} from './../../data-model-types'
import { projectUserFileInfoKey } from './keys'

const setProjectUserFileInfo = async (
  projectName: string,
  userId: string,
  fileInfo: ProjectDataReference,
): Promise<number> => {
  const validationError = ProjectDataReferenceSchema.validate(fileInfo).error

  if (validationError) {
    throw validationError
  }

  const key = projectUserFileInfoKey(projectName, userId, fileInfo.id)
  return kv.hset(key, fileInfo)
}

export default setProjectUserFileInfo
