'use server'

import { auth } from './../../auth'

import{ getFileInfo } from './../../lib/polyverse/backend/backend'

import { type ProjectDataReference, type Repository, type User } from './../../lib/data-model-types'

export async function getFileInfoForRepo(
    repo: Repository,
    user: User
  ): Promise<ProjectDataReference[]> {
    const session = await auth()
  
    if (!session?.user?.id || user.id !== session.user.id)  {
      throw new Error('Unauthorized')
    }
  
    return getFileInfo(repo, session.user.email)
}