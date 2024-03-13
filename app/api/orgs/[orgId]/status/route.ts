import { getUser } from 'app/_actions/get-user'
import { auth } from 'auth'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { UserOrgStatus } from 'lib/data-model-types'
import { getBoostOrgStatus } from 'lib/polyverse/backend/backend'
import getOrg from 'lib/polyverse/db/get-org'
import { NextAuthRequest } from 'next-auth/lib'


export const GET = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.accessToken || !auth.user.email || !auth.user.id) {
    return new Response(ReasonPhrases.UNAUTHORIZED, {
      status: StatusCodes.UNAUTHORIZED,
    })
  }

  try {
    // AuthZ: Check that the user has access to the org
    const user = await getUser(auth.user.email)

    if (!user || !user.orgIds || user.orgIds.length === 0) {
      return new Response(ReasonPhrases.NOT_FOUND, {
        status: StatusCodes.NOT_FOUND,
      })
    }

    // TODO: Should be able to do Dynamic Route segments as documented:
    // https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
    // Problem is our Auth wrapper doesn't like it. See if we can figure
    // out a way to move to this pattern.
    const reqUrl = new URL(req.url)
    const reqUrlSlices = reqUrl.toString().split('/')

    // The 2nd to the last slice ought to be the slug for the org id
    const requestedOrgId = reqUrlSlices[reqUrlSlices.length - 2]

    const foundOrgId = user.orgIds.find(
      (orgId: string) => orgId === requestedOrgId,
    )

    if (!foundOrgId) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
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

    const boostOrgStatus = await getBoostOrgStatus(org.name, user.email ?? '')

    // Convert the response format from the Boost Node backend to something we
    // expect or consistent with our developer experience (DX).
    const orgStatus: UserOrgStatus = {
      // If the `username` data member shows up on the user status that means
      // the org has the GitHub app installed.
      gitHubAppInstalled:
        boostOrgStatus.github_username &&
        boostOrgStatus.github_username.length > 0
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
