'use server'

import { kv } from '@vercel/kv'
import deleteProjectUserFileInfoIds from 'lib/polyverse/db/delete-project-user-file-info-ids'

import { auth } from '../../auth'
import {
  type ProjectDataReference,
  type User,
} from '../../lib/data-model-types'
import { projectUserFileInfoKey } from './../../lib/polyverse/db/keys'

export const deleteCachedProjectUserFileInfos = async (
  user: User,
  projectName: string,
  fileInfos: ProjectDataReference[],
) => {
  const session = await auth()
  console.debug(`Invoking server action: deleteCachedProjectUserFileInfos`)

  if (!session?.user?.id || user.id !== session.user.id) {
    throw new Error('Unauthorized')
  }

  // Delete the individual file infos...
  const delFileInfoPromises = fileInfos.map((fileInfo) =>
    kv.del(projectUserFileInfoKey(projectName, user.id, fileInfo.id)),
  )
  await Promise.all(delFileInfoPromises)

  // Delete the file info set...
  await deleteProjectUserFileInfoIds(projectName, user.id)
}
