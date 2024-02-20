'use server'

import { auth } from '../../auth'
import {
  type ProjectDataReference,
  type User,
} from '../../lib/data-model-types'
import setProjectUserFileInfo from '../../lib/polyverse/db/set-project-user-file-info'
import deleteProjectUserFileInfoIds from './../../lib/polyverse/db/delete-project-user-file-info-ids'
import setProjectUserFileInfoId from './../../lib/polyverse/db/set-project-user-file-info-id'

const setCachedProjectUserFileInfos = async (
  projectName: string,
  user: User,
  fileInfos: ProjectDataReference[],
): Promise<void> => {
  const session = await auth()

  if (!session?.user?.id || user.id !== session.user.id) {
    throw new Error('Unauthorized')
  }

  // Start by caching the file infos first. That way if they fail we won't
  // actually have the keys preserved in the users set and it will appear like
  // the cache needs to be updated and we will try again.
  const setFileInfoPromises = fileInfos.map((fileInfo) =>
    setProjectUserFileInfo(projectName, user.id, fileInfo),
  )

  await Promise.all(setFileInfoPromises)

  // Now make sure to set all of the new file info IDs for the newly cached
  // files. Start by deleting the existing set of file info IDs...
  await deleteProjectUserFileInfoIds(projectName, user.id)

  // Now add the IDs of the newly cached file infos...
  const setFileInfoIdsPromises = fileInfos.map((fileInfo) =>
    setProjectUserFileInfoId(projectName, user.id, fileInfo.id),
  )

  await Promise.all(setFileInfoIdsPromises)
}

export default setCachedProjectUserFileInfos
