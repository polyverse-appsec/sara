import { kv } from '@vercel/kv'

import {
  ProjectFileInfoSchema,
  type ProjectFileInfo,
} from './../../data-model-types'
import { projectUserFileInfoKey } from './keys'

const setProjectUserFileInfo = async (
  projectName: string,
  userId: string,
  fileInfo: ProjectFileInfo,
): Promise<number> => {
  const validationError = ProjectFileInfoSchema.validate(fileInfo).error

  if (validationError) {
    throw validationError
  }

  const key = projectUserFileInfoKey(projectName, userId, fileInfo.id)
  return kv.hset(key, fileInfo)
}

export default setProjectUserFileInfo
