'use server'

import { auth } from './../../auth'
import {
  Project,
  type ProjectDataReference,
  type Repository,
  type User,
} from './../../lib/data-model-types'
import { getFileInfo } from './../../lib/polyverse/backend/backend'

export async function getFileInfoForProject(
  projectName: string,
  orgId: string,
  user: User,
): Promise<ProjectDataReference[]> {
  const session = await auth()

  if (!session?.user?.id || user.id !== session.user.id) {
    throw new Error('Unauthorized')
  }

  return getFileInfo(projectName, orgId, session.user.email)
}
