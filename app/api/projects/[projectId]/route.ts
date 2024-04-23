import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { NextAuthRequest } from 'next-auth/lib'

import authz from './../../../../app/api/authz'
import { auth } from './../../../../auth'
import { deleteProject as deleteProjectOnBoost } from './../../../../lib/polyverse/backend/backend'
import deleteChat from './../../../../lib/polyverse/db/delete-goal'
import deleteGoal from './../../../../lib/polyverse/db/delete-goal'
import deleteProject from './../../../../lib/polyverse/db/delete-project'
import deleteProjectDataSource from './../../../../lib/polyverse/db/delete-project-data-source'
import getGoal from './../../../../lib/polyverse/db/get-goal'
import getOrg from './../../../../lib/polyverse/db/get-org'
import getProjectDb from './../../../../lib/polyverse/db/get-project'
import getUser from './../../../../lib/polyverse/db/get-user'
import updateOrg from './../../../../lib/polyverse/db/update-org'
import {
  deleteAssistant,
  deleteAssistantFiles,
  findAssistantFromMetadata,
  type AssistantMetadata,
} from './../../../../lib/polyverse/openai/assistants'
import getProjectDataSource from 'lib/polyverse/db/get-project-data-source'
import { ProjectWithDataSources } from 'lib/data-model-types'

export const GET = auth(async (req: NextAuthRequest) => {
    const { auth } = req;
  
    if (!auth || !auth.accessToken || !auth.user.email) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }
  
    try {
      const reqUrl = new URL(req.url)
      const requestedProjectId = reqUrl.toString().substring(reqUrl.toString().lastIndexOf('/') + 1)
  
      const project = await getProjectDb(requestedProjectId)
  
      if (!project) {
        return new Response(ReasonPhrases.NOT_FOUND, {
          status: StatusCodes.NOT_FOUND,
        })
      }
  
      const user = await getUser(auth.user.email)
      const org = await getOrg(project.orgId)
  
      try {
        authz.userListedOnOrg(org, user.id)
        authz.orgListedOnUser(user, org.id)
        authz.userListedOnProject(project, user.id)
      } catch (error) {
        return new Response(ReasonPhrases.FORBIDDEN, {
          status: StatusCodes.FORBIDDEN,
        })
      }
  
      (project as ProjectWithDataSources).dataSourceUris = []
      for (const projectDataSourceId of project.projectDataSourceIds) {
        try {
          const thisProjectDataSource = await getProjectDataSource(projectDataSourceId);
          (project as ProjectWithDataSources).dataSourceUris.push(thisProjectDataSource.uri)
        } catch (error) {
          console.error(`Failed to get project data source with ID: ${projectDataSourceId}`, error)
        }
      }
  
      return new Response(JSON.stringify(project), {
        status: StatusCodes.OK,
      })
    } catch (error) {
      console.error(`Failed fetching project for '${auth.user.email}' because: ${error}`)
      return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    }
  }) as any

// TODO: Should this live at /org/<orgId>/projects/<projectId>?
export const DELETE = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.accessToken || !auth.user.email) {
    return new Response('Unauthorized', {
      status: 401,
    })
  }

  try {
    // TODO: Should be able to do Dynamic Route segments as documented:
    // https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
    // Problem is our Auth wrapper doesn't like it. See if we can figure
    // out a way to move to this pattern.
    const reqUrl = new URL(req.url)
    const requestedProjectId = reqUrl
      .toString()
      .substring(reqUrl.toString().lastIndexOf('/') + 1)

    const project = await getProjectDb(requestedProjectId)

    if (!project) {
      return new Response(ReasonPhrases.NOT_FOUND, {
        status: StatusCodes.NOT_FOUND,
      })
    }

    const user = await getUser(auth.user.email)
    const org = await getOrg(project.orgId)

    try {
      authz.userListedOnOrg(org, user.id)
      authz.orgListedOnUser(user, org.id)
      authz.userListedOnProject(project, user.id)
      authz.soleUserOnProject(project, user.id)
    } catch (error) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // One simply can't take the reverse order of the Project creation logic in
    // the POST request handlers. Other resources could have been created that
    // would ultimately point back to the project - such as Goals - that also
    // have to be accounted for. Please be very thoughtful in all of the
    // resources that need to be cleaned up so as not to leave any dangling
    // resources.
    const assistantMetadata: AssistantMetadata = {
      projectId: project.id,
      userName: user.email,
      orgName: org.name,
      creator: '', // Ignore creator for search
      version: '', // Ignore version for search
      stage: process.env.SARA_STAGE || 'unknown',
    }

    const assistant = await findAssistantFromMetadata(assistantMetadata)

    // In the case that maybe the assistant never got created in the first
    // place conditionally do deletes on it
    if (assistant) {
      await deleteAssistantFiles(assistant)
      await deleteAssistant(assistant.id)
    }

    // Now move onto grooming and deleting resources in our data stores.
    org.projectIds = org.projectIds.filter(
      (projectId) => projectId !== project.id,
    )

    await updateOrg(org)

    // Delete all project and project related resources from our K/V.
    //
    // Deleting a project will delete its related resources of prompt file infos
    // since it has a relationship set key based off of the project ID.
    await deleteProject(project.id)

    // Start by retrieving our goals to check to see if they have any chats
    // associated with them. If so we need to delete those before the goals.
    const getGoalPromises = project.goalIds.map((goalId) => getGoal(goalId))
    const goals = await Promise.all(getGoalPromises)

    // Note we only have to delete the chat as it will recursively delete any
    // chat queries associated with it as they have a relationship with each
    // other
    const deleteChatPromises = goals.map((goal) =>
      goal.chatId ? deleteChat(goal.chatId) : Promise.resolve(),
    )
    await Promise.all(deleteChatPromises)

    // Now actually delete the goals
    const deleteGoalPromises = project.goalIds.map((goalId) =>
      deleteGoal(goalId),
    )

    await Promise.all(deleteGoalPromises)

    const deleteProjectDataSourcePromises = project.projectDataSourceIds.map(
      (projectDataSourceId) => deleteProjectDataSource(projectDataSourceId),
    )
    await Promise.all(deleteProjectDataSourcePromises)

    // Finally delete the project on the Boost backend
    await deleteProjectOnBoost(org.name, project.id, auth.user.email)

    return new Response(null, {
      status: 200,
    })
  } catch (error) {
    console.error(
      `Failed deleting project for '${auth.user.email}' because: ${error}`,
    )

    return new Response('Failed to fetch project', {
      status: 500,
    })
  }
}) as any

// Note: Looks like based on this commit the NextAuth team are aware that their
// wrapper is causing NextJS build errors:
// https://github.com/nextauthjs/next-auth/commit/6a2f8a1d77c633ae3d0601a30f67523f38df2ecc
//
// Build errors would look something like:
// app/api/orgs/route.ts
// Type error: Route "app/api/orgs/route.ts" has an invalid export:
//   "unknown" is not a valid GET return type:
//     Expected "void | Response | Promise<void | Response>", got "unknown".
