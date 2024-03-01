import { NextAuthRequest } from 'next-auth/lib'

import { auth } from './../../../../auth'
import getProjectDb from './../../../../lib/polyverse/db/get-project'
import getUser from './../../../../lib/polyverse/db/get-user'
import getOrg from './../../../../lib/polyverse/db/get-org'
import updateOrg from './../../../../lib/polyverse/db/update-org'
import deleteProject from './../../../../lib/polyverse/db/delete-project'
import deleteGoal from './../../../../lib/polyverse/db/delete-goal'
import deleteProjectDataSource from './../../../../lib/polyverse/db/delete-project-data-source'
import { deleteProject as deleteProjectOnBoost } from './../../../../lib/polyverse/backend/backend'

export const GET = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.accessToken || !auth.user.email) {
    return new Response('Unauthorized', {
      status: 401,
    })
  }

  try {
    // AuthZ: Check that the user has access to the project
    const user = await getUser(auth.user.email)

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
      return new Response('Not Found', {
        status: 404,
      })
    }

    const foundUserId = project.userIds.find((userId) => userId === user.id)

    if (!foundUserId) {
      return new Response('Forbidden', {
        status: 403,
      })
    }

    return new Response(JSON.stringify(project), {
      status: 200,
    })
  } catch (error) {
    console.error(
      `Failed fetching project for '${auth.user.username}' because: ${error}`,
    )

    return new Response('Failed to fetch project', {
      status: 500,
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
    // AuthZ: Check that the user has access to the project
    const user = await getUser(auth.user.email)

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
      return new Response('Not Found', {
        status: 404,
      })
    }

    const foundUserId = project.userIds.find((userId) => userId === user.id)

    if (!foundUserId) {
      return new Response('Forbidden', {
        status: 403,
      })
    }

    // This is a bad RBAC check but for now verify that there is only one user
    // within the project user IDs. If not then reject the request.
    if (project.userIds.length > 1) {
      return new Response('Forbidden', {
        status: 403,
      })
    }

    // Take the reverse order approach to project creation when deleting. Start
    // by removing the project from the org.
    const org = await getOrg(project.orgId)
    org.projectIds = org.projectIds.filter((projectId) => projectId !== project.id)
    org.lastUpdatedAt = new Date()
    await updateOrg(org)

    // Delete all project and project related resources from our K/V
    await deleteProject(project.id)

    const deleteGoalPromises = project.goalIds.map((goalId) => deleteGoal(goalId))
    await Promise.all(deleteGoalPromises)

    const deleteProjectDataSourcePromises = project.projectDataSourceIds.map((projectDataSourceId) => deleteProjectDataSource(projectDataSourceId))
    await Promise.all(deleteProjectDataSourcePromises)

    // Finally delete the project on the Boost backend
    await deleteProjectOnBoost(org.name, project.name, auth.user.email)

    return new Response(null, {
      status: 200,
    })
  } catch (error) {
    console.error(
      `Failed fetching project for '${auth.user.username}' because: ${error}`,
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
