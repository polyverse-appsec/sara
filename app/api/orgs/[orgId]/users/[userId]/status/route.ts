import { auth } from 'auth'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { UserOrgStatus } from 'lib/data-model-types'
import { NextAuthRequest } from 'next-auth/lib'

import { getBoostOrgUserStatus } from '../../../../../../../lib/polyverse/backend/backend'
import getOrg from '../../../../../../../lib/polyverse/db/get-org'
import getUser from '../../../../../../../lib/polyverse/db/get-user'
import authz from '../../../../../authz'
import logger from './../../../../../logger'

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

    // The 4th to the last slice ought to be the slug for the org id
    const requestedOrgId = reqUrlSlices[reqUrlSlices.length - 4]

    const org = await getOrg(requestedOrgId)
    const user = await getUser(auth.user.email)

    try {
      authz.userListedOnOrg(org, user.id)
      authz.orgListedOnUser(user, org.id)
    } catch (error) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    logger.infoWithContext(
      `GET /api/orgs/${org.id}/users/${user.id}/status invoking getBoostOrgUserStatus (/api/user/${org.name}/account)`,
      { user, org },
    )
    const boostOrgUserStatus = await getBoostOrgUserStatus(org.name, user.email)

    // Convert the response format from the Boost Node backend to something we
    // expect or consistent with our developer experience (DX).
    const orgUserStatus: UserOrgStatus = {
      // If the `username` data member shows up on the user status that means
      // the user has the GitHub app installed.
      gitHubAppInstalled:
        boostOrgUserStatus.backgroundAnalysisAuthorized !== undefined &&
        boostOrgUserStatus.backgroundAnalysisAuthorized
          ? 'INSTALLED'
          : 'UNKNOWN',

      isPremium:
        boostOrgUserStatus.plan && boostOrgUserStatus.plan === 'premium'
          ? 'PREMIUM'
          : 'FREE',
    }

    return new Response(JSON.stringify(orgUserStatus), {
      status: StatusCodes.OK,
    })
  } catch (error) {
    console.error(
      `Failed to get user org status for '${auth.user.username}' because: ${error}`,
    )

    return new Response('Failed to get user org status', {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    })
  }
}) as any
