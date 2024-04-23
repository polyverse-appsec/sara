import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import Joi from 'joi'
import { type ChatQueryStatus, type FineTuningTags } from 'lib/data-model-types'
import logger, { type SaraLogContext } from 'lib/logger'
import getChat from 'lib/polyverse/db/get-chat'
import getChatQuery from 'lib/polyverse/db/get-chat-query'
import getGoal from 'lib/polyverse/db/get-goal'
import getOrg from 'lib/polyverse/db/get-org'
import getUser from 'lib/polyverse/db/get-user'
import updateChat from 'lib/polyverse/db/update-chat'
import updateChatQuery from 'lib/polyverse/db/update-chat-query'
import { NextAuthRequest } from 'next-auth/lib'

import { auth } from '../../../../../../../auth'
import authz from './../../../../../../../app/api/authz'
import getProject from './../../../../../../../lib/polyverse/db/get-project'
import addChatQueryIdToGlobalFineTuningSet from 'lib/polyverse/db/add-chat-query-id-to-global-fine-tuning-set'
import removeChatQueryIdFromGlobalFineTuningSet from 'lib/polyverse/db/remove-chat-query-id-from-global-fine-tuning-set'

export interface FineTuningChatQueryRequestBody {
  fineTuningTags: FineTuningTags[]
}

export const POST = auth(async (req: NextAuthRequest) => {
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

    const requestedChatQueryId = reqUrlSlices[reqUrlSlices.length - 2]

    const user = await getUser(auth.user.email)
    const chatQuery = await getChatQuery(requestedChatQueryId)
    const chat = await getChat(chatQuery.chatId)

    let goal = null

    if (chat.goalId) {
      goal = await getGoal(chat.goalId)
    }

    // Right now we only allow chats on goals but be defensive for when we allow
    // chats on tasks. Also consider this REALLY bad if this conditional ever
    // evaluates to true.
    if (!goal) {
      logger.errorWithContext(
        `Chat ${chat.id} doesn't contain an ID for a goal`,
        { user },
      )

      return new Response('Chat not linked to a goal', {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    }

    const org = await getOrg(goal.orgId)
    const project = await getProject(goal.parentProjectId)

    try {
      authz.userListedOnOrg(org, user.id)
      authz.orgListedOnUser(user, org.id)
      authz.userListedOnProject(project, user.id)
    } catch (error) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // Validate the request body
    const reqBody = (await req.json()) as FineTuningChatQueryRequestBody
    const fineTuningTags = reqBody.fineTuningTags

    if (!fineTuningTags) {
        return new Response(
            `'fineTuningTags' must be provided`,
            {
              status: StatusCodes.BAD_REQUEST,
            },
          )
    }

    chatQuery.fineTuningTags = fineTuningTags
    await updateChatQuery(chatQuery)

    const fineTuningTaggingPromises: Promise<void>[] = []

    if (fineTuningTags.includes('FAVORITE')) {
        fineTuningTaggingPromises.push(addChatQueryIdToGlobalFineTuningSet('FAVORITE', chatQuery.id))
    } else {
        fineTuningTaggingPromises.push(removeChatQueryIdFromGlobalFineTuningSet('FAVORITE', chatQuery.id))
    }

    if (fineTuningTags.includes('INSIGHTFUL')) {
        fineTuningTaggingPromises.push(addChatQueryIdToGlobalFineTuningSet('INSIGHTFUL', chatQuery.id))
    } else {
        fineTuningTaggingPromises.push(removeChatQueryIdFromGlobalFineTuningSet('INSIGHTFUL', chatQuery.id))
    }

    if (fineTuningTags.includes('PRODUCTIVE')) {
        fineTuningTaggingPromises.push(addChatQueryIdToGlobalFineTuningSet('PRODUCTIVE', chatQuery.id))
    } else {
        fineTuningTaggingPromises.push(removeChatQueryIdFromGlobalFineTuningSet('PRODUCTIVE', chatQuery.id))
    }

    if (fineTuningTags.includes('UNHELPFUL')) {
        fineTuningTaggingPromises.push(addChatQueryIdToGlobalFineTuningSet('UNHELPFUL', chatQuery.id))
    } else {
        fineTuningTaggingPromises.push(removeChatQueryIdFromGlobalFineTuningSet('UNHELPFUL', chatQuery.id))
    }

    await Promise.all(fineTuningTaggingPromises)

    return new Response(JSON.stringify(chatQuery), {
      status: StatusCodes.OK,
    })
  } catch (error) {
    logger.errorWithContext('Failed to add fine tuning tags to chat query', { error })

    return new Response('Failed to add fine tuning tags to chat query', {
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
