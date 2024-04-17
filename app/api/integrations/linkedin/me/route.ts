import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import logger from 'lib/logger'
import { NextAuthRequest } from 'next-auth/lib'

import { auth } from '../../../../../auth'

export const GET = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.accessToken) {
    return new Response(ReasonPhrases.UNAUTHORIZED, {
      status: StatusCodes.UNAUTHORIZED,
    })
  }

  try {
    return new Response(ReasonPhrases.OK, {
      status: StatusCodes.OK,
    })
  } catch (error) {
    logger.error(
      `Failed fetching LinkedIn user details for '${auth.user.username}' because: ${error}`,
    )

    return new Response('Failed to fetch LinkedIn user details', {
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
