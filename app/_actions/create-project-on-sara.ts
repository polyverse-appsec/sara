'use server'

import { auth } from '../../auth'
import {
  Organization,
  type Project,
  type Repository,
} from '../../lib/data-model-types'
import { createNewProject } from '../../lib/polyverse/project/project'

export async function createProjectOnSara(
  projectName: string,
  primaryDataReference: Repository,
  secondaryDataReferences: Repository[],
  org: Organization,
): Promise<Project> {
  // Rather than delegate auth to functions we consume we protect ourselves and
  // do a check here before we consume each method as well in case there are any
  // behavioral changes to said consumed functions.
  const session = await auth()

  // Apply business logic auth check for `getRepository`
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  return createNewProject(
    projectName,
    primaryDataReference,
    secondaryDataReferences,
    session.user,
    org,
  )
}
