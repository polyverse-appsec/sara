'use server'

import { auth } from './../../auth'
import { type Repository } from './../../lib/data-model-types'
import { createProject } from './../../lib/polyverse/backend/backend'

export async function createProjectOnBoost(
  projectName: string,
  orgId: string,
  primaryDataSource: Repository,
  secondaryDataSources: Repository[],
) {
  const session = await auth()

  if (!session?.user?.id || !session.user.email) {
    throw new Error('Unauthorized')
  }

  await createProject(
    projectName,
    orgId,
    primaryDataSource,
    secondaryDataSources,
    session.user.email,
  )
}
