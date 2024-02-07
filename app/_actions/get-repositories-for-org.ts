'use server'

import { auth } from './../../auth'

import { type Repository } from './../../lib/data-model-types'

import {
    fetchOrganizationRepositories,
    getOrCreateRepoFromGithubRepo,
  } from './../../lib/polyverse/github/repos'

export async function getRepositoriesForOrg(
    org: string,
  ): Promise<Repository[]> {
    const session = await auth()
  
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }
    const repos = await fetchOrganizationRepositories({
      accessToken: session.accessToken,
      org,
    })
  
    //IMPORTANT note:  the repo's returned from fetchOrganizationRepositories are github repos, and may be missing extra information we have
    //so loop through the repos and either lookup or create the repo data stucture in out system
    const fullRepos = []
    for (const repo of repos) {
      const fullRepo = await getOrCreateRepoFromGithubRepo(repo, session.user.id)
      fullRepos.push(fullRepo)
    }
    return fullRepos
}