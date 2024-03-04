'use server'

import { auth } from './../../auth'
import { type Repository } from './../../lib/data-model-types'
import { createProject } from './../../lib/polyverse/backend/backend'

export async function createProjectOnBoost(
  projectName: string,
  primaryDataSource: Repository,
  secondaryDataSources: Repository[],
) {
  const session = await auth()
  console.debug(`Invoking server action: createProjectOnBoost`)
  console.debug(`createProjectOnBoost server action param: projectName - ${projectName}`)
  console.debug(`createProjectOnBoost server action param: primaryDataSource - ${JSON.stringify(primaryDataSource)}`)
  console.debug(`createProjectOnBoost server action param: secondaryDataSources - ${JSON.stringify(secondaryDataSources)}`)

  if (!session?.user?.id || !session.user.email) {
    throw new Error('Unauthorized')
  }

  await createProject(
    projectName,
    primaryDataSource,
    secondaryDataSources,
    session.user.email,
  )
}
