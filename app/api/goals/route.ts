import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { NextAuthRequest } from 'next-auth/lib'

import { auth } from '../../../auth'
import { type GoalPartDeux } from './../../../lib/data-model-types'
import createGoal from './../../../lib/polyverse/db/create-goal'
import getOrg from './../../../lib/polyverse/db/get-org'
import getProject from './../../../lib/polyverse/db/get-project'
import getUser from './../../../lib/polyverse/db/get-user'
import updateProject from './../../../lib/polyverse/db/update-project'
import { createBaseSaraObject } from './../../../lib/polyverse/db/utils'

import authz from '../authz'

interface POSTGoalReqBody {
  // TODO: Make sure we mark request body data members as optional in other
  // handlers and check that they deserialized or fail with 400.
  // All of these properties are required for successful processing
  orgId?: string
  name?: string
  description?: string
  acceptanceCriteria?: string
  parentProjectId?: string
}

export const POST = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.user.email || !auth.user.id) {
    return new Response(ReasonPhrases.UNAUTHORIZED, {
      status: StatusCodes.UNAUTHORIZED,
    })
  }

  try {
    // Perform validation on the request body data
    const reqBody = (await req.json()) as POSTGoalReqBody

    // Crucial to AuthZ
    if (!reqBody.orgId || reqBody.orgId.length === 0) {
      return new Response(`Request body is missing 'orgId'`, {
        status: StatusCodes.BAD_REQUEST,
      })
    }

    // Crucial to AuthZ
    if (!reqBody.parentProjectId || reqBody.parentProjectId.length === 0) {
      return new Response(`Request body is missing 'parentProjectId'`, {
        status: StatusCodes.BAD_REQUEST,
      })
    }

    // Crucial to helping Sara contextualize the goal (i.e. used for prompt
    // engineering)
    if (!reqBody.name || reqBody.name.trim().length === 0) {
      return new Response(`Request body is missing 'name'`, {
        status: StatusCodes.BAD_REQUEST,
      })
    }

    // Crucial to helping Sara contextualize the goal (i.e. used for prompt
    // engineering)
    if (!reqBody.description || reqBody.description.trim().length === 0) {
      return new Response(`Request body is missing 'description'`, {
        status: StatusCodes.BAD_REQUEST,
      })
    }

    // AuthZ: Check that the user has access to the org
    const org = await getOrg(reqBody.orgId)
    const user = await getUser(auth.user.email)
    const project = await getProject(reqBody.parentProjectId)

    try {
      authz.userListedOnOrg(org, user.id)
      authz.orgListedOnUser(user, org.id)
      authz.userListedOnProject(project, user.id)
    } catch (error) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // Prep details from the request for our goal that we will write to the K/V
    const name = reqBody.name.trim()
    const description = reqBody.description.trim()
    const acceptanceCriteria = reqBody.acceptanceCriteria
      ? reqBody.acceptanceCriteria.trim()
      : null

    // Write a goal to our K/V
    const goalBaseSaraObject = createBaseSaraObject()
    const goal: GoalPartDeux = {
      // BaseSaraObject properties
      ...goalBaseSaraObject,

      // Goal properties
      orgId: org.id,
      name,
      description,
      acceptanceCriteria,
      // Right now the only status value we have defined is 'OPEN'
      status: 'OPEN',
      chatId: null,
      parentProjectId: project.id,
      taskIds: [],
    }

    await createGoal(goal)

    // Update our project with the goal ID...
    project.goalIds = [...project.goalIds, goal.id]
    await updateProject(project)

    // Return the goal details we created to the user...
    return new Response(JSON.stringify(goal), {
      status: StatusCodes.CREATED,
    })
  } catch (error) {
    console.error(
      `Failed creating goal for '${auth.user.username}' because: ${error}`,
    )

    return new Response('Failed to create goal', {
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
