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

interface POSTGoalReqBody {
  // TODO: Make sure we mark request body data members as optional in other
  // handlers and check that they deserialized or fail with 400.
  // All of these properties are required for successful processing
  orgId?: string
  name?: string
  description?: string
  parentProjectId?: string
}

export const POST = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.accessToken || !auth.user.email || !auth.user.id) {
    return new Response(ReasonPhrases.UNAUTHORIZED, {
      status: StatusCodes.UNAUTHORIZED,
    })
  }

  try {
    // Perform validation on the request body data
    const reqBody = (await req.json()) as POSTGoalReqBody

    // TODO: Validate these using Joi
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
    if (!reqBody.name || reqBody.name.length === 0) {
      return new Response(`Request body is missing 'name'`, {
        status: StatusCodes.BAD_REQUEST,
      })
    }

    // Crucial to helping Sara contextualize the goal (i.e. used for prompt
    // engineering)
    if (!reqBody.description || reqBody.description.length === 0) {
      return new Response(`Request body is missing 'description'`, {
        status: StatusCodes.BAD_REQUEST,
      })
    }

    // AuthZ: Check that the user has access to the org
    const user = await getUser(auth.user.email)

    if (!user.orgIds || user.orgIds.length === 0) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    const foundOrgId = user.orgIds.find((orgId) => orgId === reqBody.orgId)

    if (!foundOrgId) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // AuthZ: Check that the user is associated with the requested org
    const org = await getOrg(reqBody.orgId)

    if (!org.userIds || org.userIds.length === 0) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    const foundUserIdOnOrg = org.userIds.find((userId) => userId === user.id)

    if (!foundUserIdOnOrg) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // AuthZ: Check that the user is associated with the requested project
    const project = await getProject(reqBody.parentProjectId)

    if (!project.userIds || project.userIds.length === 0) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    const foundUserIdOnProject = project.userIds.find(
      (userId) => userId === user.id,
    )

    if (!foundUserIdOnProject) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // Write a goal to our K/V
    const goalBaseSaraObject = createBaseSaraObject()
    const goal: GoalPartDeux = {
      // BaseSaraObject properties
      ...goalBaseSaraObject,

      // Goal properties
      orgId: org.id,
      name: reqBody.name,
      description: reqBody.description,
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
