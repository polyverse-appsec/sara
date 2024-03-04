import {
	ReasonPhrases,
	StatusCodes,
} from 'http-status-codes'

import { NextAuthRequest } from 'next-auth/lib'

import { auth } from './../../../../auth'
import getOrg from './../../../../lib/polyverse/db/get-org'
import getUser from './../../../../lib/polyverse/db/get-user'

export const GET = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.accessToken || !auth.user.email) {
    return new Response(ReasonPhrases.UNAUTHORIZED, {
      status: StatusCodes.UNAUTHORIZED,
    })
  }

  try {
    // AuthZ: Check that the user has access to the org
    const user = await getUser(auth.user.email)

    if (!user.orgIds || user.orgIds.length === 0) {
      return new Response(ReasonPhrases.NOT_FOUND, {
        status: StatusCodes.NOT_FOUND,
      })
    }

    // TODO: Should be able to do Dynamic Route segments as documented:
    // https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
    // Problem is our Auth wrapper doesn't like it. See if we can figure
    // out a way to move to this pattern.
    const reqUrl = new URL(req.url)
    const requestedOrgId = reqUrl
      .toString()
      .substring(reqUrl.toString().lastIndexOf('/') + 1)

    const foundOrgId = user.orgIds.find((orgId) => orgId === requestedOrgId)

    if (!foundOrgId) {
      return new Response(ReasonPhrases.NOT_FOUND, {
        status: StatusCodes.NOT_FOUND,
      })
    }

    // AuthZ: Check the user is associated with the requested org
    const org = await getOrg(requestedOrgId)

    if (!org.userIds || org.userIds.length === 0) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    const foundUserId = org.userIds.find((userId) => userId === user.id)

    if (!foundUserId) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    return new Response(JSON.stringify(org), {
      status: StatusCodes.OK,
    })
  } catch (error) {
    console.error(
      `Failed fetching orgs for '${auth.user.username}' because: ${error}`,
    )

    return new Response('Failed to fetch organizations', {
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
