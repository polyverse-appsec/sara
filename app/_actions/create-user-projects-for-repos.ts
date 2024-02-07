'use server'

import { auth } from './../../auth'
import { createUserProjectForRepo } from './../../lib/polyverse/backend/backend'

import { type Repository } from './../../lib/data-model-types'

export async function createUserProjectsForRepos(repos: Repository[]) {
    const session = await auth()
  
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }
    //for all of the repos in the project, tickle them, this can be done in parallel
    //await all of the tickle promises
    const ticklePromises = []
    for (const repo of repos) {
      ticklePromises.push(createUserProjectForRepo(repo, session.user.email || ''))
    }
  
    await Promise.all(ticklePromises)
}