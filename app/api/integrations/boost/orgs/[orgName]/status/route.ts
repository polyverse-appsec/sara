import { auth } from 'auth'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { UserOrgStatus } from 'lib/data-model-types'
import { getBoostOrgStatus } from 'lib/polyverse/backend/backend'
import getUser from 'lib/polyverse/db/get-user'
import { NextAuthRequest } from 'next-auth/lib'
import logger from './../../../../../../../app/api/logger'

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

    // The 2nd to the last slice ought to be the slug for the org name
    const requestedOrgName = reqUrlSlices[reqUrlSlices.length - 2]

    const user = await getUser(auth.user.email)
    
    logger.infoWithContext(`GET /api/integrations/boost/orgs/${requestedOrgName}/status invoking getBoostOrgStatus (/api/org/${requestedOrgName}/account)`, {user})
    const boostOrgStatus = await getBoostOrgStatus(requestedOrgName, user.email)

    // Convert the response format from the Boost Node backend to something we
    // expect or consistent with our developer experience (DX).
    const orgStatus: UserOrgStatus = {
      // If the `username` data member shows up on the user status that means
      // the org has the GitHub app installed.
      gitHubAppInstalled:
        boostOrgStatus.backgroundAnalysisAuthorized !== undefined &&
        boostOrgStatus.backgroundAnalysisAuthorized
          ? 'INSTALLED'
          : 'UNKNOWN',

      isPremium:
        boostOrgStatus.plan && boostOrgStatus.plan === 'premium'
          ? 'PREMIUM'
          : 'FREE',
    }

    return new Response(JSON.stringify(orgStatus), {
      status: StatusCodes.OK,
    })
  } catch (error) {
    console.error(
      `Failed to get org status for '${auth.user.username}' because: ${error}`,
    )

    return new Response('Failed to get org status', {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    })
  }
}) as any
