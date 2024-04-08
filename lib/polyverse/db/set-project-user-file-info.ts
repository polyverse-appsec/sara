import { kv } from '@vercel/kv'

import {
  ProjectFileInfoSchema,
} from './../../data-model-types'
import { projectUserFileInfoKey } from './keys'
import { ProjectDataReference } from '../backend/types/BoostProjectDataReference'

const setProjectUserFileInfo = async (
  projectName: string,
  userId: string,
  fileInfo: ProjectDataReference,
): Promise<number> => {
  const validationError = ProjectFileInfoSchema.validate(fileInfo).error

  if (validationError) {
    throw validationError
  }

  const key = projectUserFileInfoKey(projectName, userId, fileInfo.id)
  return kv.hset(key, fileInfo)
}

export default setProjectUserFileInfo
