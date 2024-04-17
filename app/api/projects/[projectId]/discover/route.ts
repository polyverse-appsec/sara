import { ReasonPhrases, StatusCodes } from 'http-status-codes'

import { auth } from '../../../../../auth'
import { NextAuthRequest } from 'next-auth/lib'

import { rediscoverProject } from './../../../../../lib/polyverse/backend/backend'
import getProject from './../../../../../lib/polyverse/db/get-project'
import getUser from './../../../../../lib/polyverse/db/get-user'
import getOrg from './../../../../../lib/polyverse/db/get-org'
import authz from './../../../../../app/api/authz'

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
    await rediscoverProject(org.id, project.id, userEmail)

    return new Response('Project rediscovery initiated successfully.', {
        status: StatusCodes.OK,
        })
  } catch (err : any) {
    console.error(`${userEmail} ${projectId} Caught error when trying to rediscover a project: `, err.stack || err)
    return new Response('Failed to initiate project rediscovery.', {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    })
  }
})
