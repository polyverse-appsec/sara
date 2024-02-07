'use server'

import { auth } from './../../auth'
import { getProject } from './get-project'
import { createNewProjectFromRepository } from './../../lib/polyverse/project/project'

import { type Project, type Repository, type User } from './../../lib/data-model-types'

export async function getOrCreateProjectForRepo(
    repo: Repository,
    user: User,
  ): Promise<Project | null> {
    // Rather than delegate auth to functions we consume we protect ourselves and
    // do a check here before we consume each method as well in case there are any
    // behavioral changes to said consumed functions.
    const session = await auth()
  
    // Apply business logic auth check for `getRepository`
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }
  
    //go through the user.projects array and see if we have a project with the same name as the repo
  
    const retrievedProject = await getProject(
      `project:${repo.full_name}:${user.id}`,
    )
  
    if (retrievedProject) {
      return retrievedProject
    }
  
    const newProj = await createNewProjectFromRepository(repo, user)
    return newProj
}