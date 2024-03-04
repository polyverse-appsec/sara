import { NextAuthRequest } from 'next-auth/lib'

import {
	ReasonPhrases,
	StatusCodes,
} from 'http-status-codes'

import { auth } from './../../../../../auth'
import getGoal from './../../../../../lib/polyverse/db/get-goal'
import getOrg from './../../../../../lib/polyverse/db/get-org'
import getProject from './../../../../../lib/polyverse/db/get-project'
import getUser from './../../../../../lib/polyverse/db/get-user'

export const GET = auth(async (req: NextAuthRequest) => {
    const { auth } = req

    if (!auth || !auth.accessToken || !auth.user.email || !auth.user.id) {
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

        // The 2nd to the last slice ought to be the slug for the repo name
        const requestedProjectId = reqUrlSlices[reqUrlSlices.length - 2]

        // AuthZ: Check that the user has access to the project that is being requested
        const user = await getUser(auth.user.email)

        console.debug(`User '${user.email}' is attempting to fetch goals for project '${requestedProjectId}'`)

        const project = await getProject(requestedProjectId)

        if (!project.userIds || project.userIds.length === 0) {
            return new Response(ReasonPhrases.UNAUTHORIZED, {
                status: StatusCodes.UNAUTHORIZED
            })
        }

        const foundUserIdOnProject = project.userIds.find((userId) => userId = user.id)

        if (!foundUserIdOnProject) {
            return new Response(ReasonPhrases.UNAUTHORIZED, {
                status: StatusCodes.UNAUTHORIZED
            })
        }

        // AuthZ: Check that the user has access to the organization that is listed
        if (!user.orgIds || user.orgIds.length === 0) {
            return new Response(ReasonPhrases.UNAUTHORIZED, {
                status: StatusCodes.UNAUTHORIZED,
            })
        }
        
        const foundOrgId = user.orgIds.find((orgId) => orgId === project.orgId)

        if (!foundOrgId) {
            // TODO: Add log statements for when someone is trying to access something unauthorized
            return new Response(ReasonPhrases.UNAUTHORIZED, {
                status: StatusCodes.UNAUTHORIZED
            })
        }

        // AuthZ: Check that the organization that owns the project has listed
        // the user as part of the organization
        const org = await getOrg(project.orgId)

        if (!org.userIds || org.userIds.length === 0) {
            return new Response(ReasonPhrases.UNAUTHORIZED, {
                status: StatusCodes.UNAUTHORIZED
            })
        }

        const foundUserIdOnOrg = org.userIds.find((userId) => userId === user.id)

        if (!foundUserIdOnOrg) {
            return new Response(ReasonPhrases.UNAUTHORIZED, {
                status: StatusCodes.UNAUTHORIZED
            })
        }

        const goalPromises = project.goalIds.map((goalId) => getGoal(goalId))
        const goals = await Promise.all(goalPromises)
  
        // Return the goals for a project to a user...
        return new Response(JSON.stringify(goals), {
            status: StatusCodes.OK,
        })
    } catch (error) {
      console.error(
        `Failed fetching goals for '${auth.user.username}' because: ${error}`,
      )
  
      return new Response('Failed to fetch goals', {
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