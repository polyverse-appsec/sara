'use server'

import { Assistant } from 'openai/resources/beta/assistants/assistants'
import { auth } from './../../auth'

import { type Project, type Repository, type User, type Organization } from './../../lib/data-model-types'
import { configAssistantForProject } from './config-assistant-for-project'
import { createProjectOnBoost } from './create-project-on-boost'
import { createProjectOnSara } from './create-project-on-sara'
import { getFileInfoForProject } from './get-file-info-for-repo'

export const createProject = async (
    user: User,
    org: Organization,
    projectName: string,
    primaryDataSource: Repository,
    secondaryDataSources: Repository[]
): Promise<[Project, Assistant]> => {
    const session = await auth()

    if (!session?.user?.id || user?.id !== session.user.id) {
        throw new Error('Unauthorized')
    }

    // First start by creating the project on the Boost service...
    // TODO: Get the returned value here
    await createProjectOnBoost(projectName, primaryDataSource, secondaryDataSources)

    // Then create the project on the Sara service...
    // NOTE: assistant creation logic added into this method!
    const project = await createProjectOnSara(projectName, primaryDataSource, secondaryDataSources, org)

    // Prepare for OpenAI Assistant creation by gathering file information...
    // TODO: Refactor naming and method to be built around a project
    //const fileInfos = await getFileInfoForProject(primaryDataSource, user)

    // Configure the OpenAI Assistant...
    //const assistant = await configAssistantForProject(project, fileInfos, user, org)

    const assistant = project.assistant as Assistant

    return [project, assistant]
}