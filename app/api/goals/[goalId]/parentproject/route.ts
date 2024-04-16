import authz from 'app/api/authz'
import { auth } from 'auth'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import deleteChat from 'lib/polyverse/db/delete-chat'
import getGoal from 'lib/polyverse/db/get-goal'
import getOrg from 'lib/polyverse/db/get-org'
import getProject from 'lib/polyverse/db/get-project'
import getUser from 'lib/polyverse/db/get-user'
import { NextAuthRequest } from 'next-auth/lib'

export const GET = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.user.email) {
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

    // The 2nd to last slice ought to be the slug for the goal ID
    const requestedGoalId = reqUrlSlices[reqUrlSlices.length - 2]

    const goal = await getGoal(requestedGoalId)
    const org = await getOrg(goal.orgId)
    const user = await getUser(auth.user.email)
    const project = await getProject(goal.parentProjectId)

    try {
      authz.userListedOnOrg(org, user.id)
      authz.orgListedOnUser(user, org.id)
      authz.userListedOnProject(project, user.id)
    } catch (error) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // Finally authorized... return the goal to the client
    return new Response(JSON.stringify(project), {
      status: StatusCodes.OK,
    })
  } catch (error) {
    console.error(
      `Failed retrieving project for goal for '${auth.user.username}' because: ${error}`,
    )

    return new Response('Failed to retrieve project for goal', {
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
