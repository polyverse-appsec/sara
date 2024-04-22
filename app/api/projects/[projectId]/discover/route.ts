import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { NextAuthRequest } from 'next-auth/lib'

import { auth } from '../../../../../auth'
import authz from './../../../../../app/api/authz'
import { rediscoverProject } from './../../../../../lib/polyverse/backend/backend'
import getOrg from './../../../../../lib/polyverse/db/get-org'
import getProject from './../../../../../lib/polyverse/db/get-project'
import getUser from './../../../../../lib/polyverse/db/get-user'

export const maxDuration = 30

export const POST = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.user.email || !auth.user.id) {
    return new Response(ReasonPhrases.UNAUTHORIZED, {
      status: StatusCodes.UNAUTHORIZED,
    })
  }

  const userId = auth.user.id
  const userEmail = auth.user.email

  const reqUrl = new URL(req.url)
  const reqUrlSlices = reqUrl.toString().split('/')

  // The 2nd to the last slice ought to be the slug for the project ID
  const projectId = reqUrlSlices[reqUrlSlices.length - 2]

  try {
    const user = await getUser(userEmail)
    const project = await getProject(projectId as string)
    const org = await getOrg(project.orgId)

    try {
      authz.userListedOnOrg(org, userId)
      authz.orgListedOnUser(user, org.id)
      authz.userListedOnProject(project, userId)
    } catch (error) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // Call the rediscoverProject function
    await rediscoverProject(org.name, project.id, userEmail)

    return new Response('Project rediscovery initiated successfully.', {
      status: StatusCodes.OK,
    })
  } catch (err: any) {
    console.error(
      `${userEmail} ${projectId} Caught error when trying to rediscover a project: `,
      err.stack || err,
    )
    return new Response('Failed to initiate project rediscovery.', {
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
