'use server'

import { ProjectDataReference, type User } from '../../lib/data-model-types'
import { auth } from './../../auth'
import { getProjectUserFileInfoIds } from './../../lib/polyverse/db/get-project-user-file-info-ids'
import getProjectUserFileInfos from './../../lib/polyverse/db/get-project-user-file-infos'

const getCachedProjectUserFileInfos = async (
  projectName: string,
  user: User,
): Promise<ProjectDataReference[]> => {
  const session = await auth()
  console.debug(`Invoking server action: getCachedProjectUserFileInfos`)

  if (!session?.user?.id || !user || user.id !== session.user.id) {
    throw new Error('Unauthorized')
  }

  const fileInfoIds = await getProjectUserFileInfoIds(projectName, user.id)
  const fileInfos = await getProjectUserFileInfos(
    projectName,
    user.id,
    fileInfoIds,
  )

  return fileInfos
}

export default getCachedProjectUserFileInfos
