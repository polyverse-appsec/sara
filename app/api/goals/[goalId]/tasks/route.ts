import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { NextAuthRequest } from 'next-auth/lib'

import { auth } from '../../../../../auth'
import getGoal from './../../../../../lib/polyverse/db/get-goal'
import getOrg from './../../../../../lib/polyverse/db/get-org'
import getProject from './../../../../../lib/polyverse/db/get-project'
import getTask from './../../../../../lib/polyverse/db/get-task'
import getUser from './../../../../../lib/polyverse/db/get-user'

export const GET = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.accessToken || !auth.user.email) {
    return new Response(ReasonPhrases.UNAUTHORIZED, {
      status: StatusCodes.UNAUTHORIZED,
    })
  }

  try {
    // TODO: Should be able to do Dynamic Route segments as documented:
    // https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
    // Problem is our Auth wrapper doesn't like it. See if we can figure
    // out a way to move to this pattern.
    const reqUrl = new URL(req.url)
    const reqUrlSlices = reqUrl.toString().split('/')

    // The last slice ought to be the slug for the goal ID
    const requestedGoalId = reqUrlSlices[reqUrlSlices.length - 2]

    // AuthZ: Check that the user is listed as a member on the org that owns
    // the goal
    const goal = await getGoal(requestedGoalId)
    const org = await getOrg(goal.orgId)

    if (!org.userIds || org.userIds.length === 0) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    const user = await getUser(auth.user.email)

    const foundUserIdOnOrg = org.userIds.find((userId) => userId === user.id)

    if (!foundUserIdOnOrg) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // AuthZ: Check that the user lists the org as something they are a
    // member of
    if (!user.orgIds || user.orgIds.length === 0) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    const foundOrgId = user.orgIds.find((orgId) => orgId === org.id)

    if (!foundOrgId) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // AuthZ: Check that the project the goal is associated with lists the
    // user
    const project = await getProject(goal.parentProjectId)

    if (!project.userIds || project.userIds.length === 0) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    const foundUserIdOnProject = project.userIds.find(
      (userId) => userId === user.id,
    )

    if (!foundUserIdOnProject) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // Finally authorized... Fetch the tasks associated with the goal and
    // return them to the client
    const taskPromises = goal.taskIds.map((taskId) => getTask(taskId))
    const tasks = await Promise.all(taskPromises)

    // Finally authorized... return the goal to the client
    return new Response(JSON.stringify(tasks), {
      status: StatusCodes.OK,
    })
  } catch (error) {
    console.error(
      `Failed fetching tasks for goal for '${auth.user.email}' because: ${error}`,
    )

    return new Response('Failed to goal', {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
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
