'use server'

import { auth } from './../../auth'
import { getProjectUserFileInfoIds } from './../../lib/polyverse/db/get-project-user-file-info-ids'

import getProjectUserFileInfos from './../../lib/polyverse/db/get-project-user-file-infos'

import { ProjectDataReference, type User } from '../../lib/data-model-types'

const getCachedProjectUserFileInfos = async (projectName: string, user: User): Promise<ProjectDataReference[]> => {
    const session = await auth()

    if (!session?.user?.id || !user || user.id !== session.user.id) {
        throw new Error('Unauthorized')
    }

    const fileInfoIds = await getProjectUserFileInfoIds(projectName, user.id)
    const fileInfos = await getProjectUserFileInfos(projectName, user.id, fileInfoIds)

    return fileInfos
}

export default getCachedProjectUserFileInfos