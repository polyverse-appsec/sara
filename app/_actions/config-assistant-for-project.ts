'use server'

import { type Assistant } from 'openai/resources/beta/assistants/assistants'

import { auth } from './../../auth'
import { configAssistantWithFileInfos } from './../../lib/polyverse/openai/assistants'

import { type Project, type ProjectDataReference, type User } from './../../lib/data-model-types'

export async function configAssistantForProject(
    project: Project,
    fileInfos: ProjectDataReference[],
    user: User
  ): Promise<Assistant> {
    const session = await auth()
  
    if (!session?.user?.id || user.id !== session.user.id)  {
      throw new Error('Unauthorized')
    }
  
    return configAssistantWithFileInfos(project, fileInfos)
}