import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import Joi from 'joi'
import { type ChatQueryStatus } from 'lib/data-model-types'
import logger, { type SaraLogContext } from 'lib/logger'
import getChat from 'lib/polyverse/db/get-chat'
import getChatQuery from 'lib/polyverse/db/get-chat-query'
import getGoal from 'lib/polyverse/db/get-goal'
import getOrg from 'lib/polyverse/db/get-org'
import getUser from 'lib/polyverse/db/get-user'
import updateChat from 'lib/polyverse/db/update-chat'
import updateChatQuery from 'lib/polyverse/db/update-chat-query'
import { NextAuthRequest } from 'next-auth/lib'

import { auth } from '../../../../../../auth'
import authz from './../../../../../../app/api/authz'
import getProject from './../../../../../../lib/polyverse/db/get-project'
import {
  ASSISTANT_METADATA_CREATOR,
  findAssistantFromMetadata,
  type AssistantMetadata,
} from './../../../../../../lib/polyverse/openai/assistants'
import {
  addQueryToThreadForProjectGoalChatting,
  cancelThreadRunForProjectGoalChatting,
  createThreadRunForProjectGoalChatting,
} from './../../../../../../lib/polyverse/openai/goalsAssistant'

export interface ModifyChatQueryRequestBody {
  status: ChatQueryStatus
}

export const PATCH = auth(async (req: NextAuthRequest) => {
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

    const requestedChatQueryId = reqUrlSlices[reqUrlSlices.length - 1]

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

    // Enforce modifications of only the last chat query
    if (chatQuery.nextChatQueryId) {
      return new Response('Attempting to modify non-tail chat query', {
        status: StatusCodes.BAD_REQUEST,
      })
    }

    // Validate the request body
    const reqBody = (await req.json()) as ModifyChatQueryRequestBody

    if (
      Joi.string()
        .valid('QUERY_RECEIVED', 'CANCELLED')
        .required()
        .validate(reqBody.status).error
    ) {
      return new Response(
        `'status' is only allowed to have the 'QUERY_RECEIVED' or 'CANCELLED' value`,
        {
          status: StatusCodes.BAD_REQUEST,
        },
      )
    }

    // Verify that the requested `status` state change is allowed to transition
    // given the curren status of the chat query
    if (
      reqBody.status === 'CANCELLED' &&
      chatQuery.status !== 'QUERY_RECEIVED' &&
      chatQuery.status !== 'QUERY_SUBMITTED'
    ) {
      return new Response(
        `Unable to cancel chat query that isn't in a 'QUERY_RECEIVED' or 'QUERY_SUBMITTED' state`,
        {
          status: StatusCodes.BAD_REQUEST,
        },
      )
    }

    if (
      reqBody.status === 'QUERY_RECEIVED' &&
      chatQuery.status !== 'CANCELLED' &&
      chatQuery.status !== 'ERROR' &&
      chatQuery.status !== 'RESPONSE_RECEIVED'
    ) {
      return new Response(
        `Unable to receive query submission when existing chat query isn't in an 'ERROR', 'CANCELLED' or 'RESPONSE_RECEIVED' state`,
        {
          status: StatusCodes.BAD_REQUEST,
        },
      )
    }

    if (reqBody.status !== 'QUERY_RECEIVED' && reqBody.status !== 'CANCELLED') {
      return new Response(
        `Chat query 'status' can only be set to 'QUERY_RECEIVED' or 'CANCELLED'`,
        {
          status: StatusCodes.BAD_REQUEST,
        },
      )
    }

    // Validate that there is an OpenAI Thread associated with the chat for
    // processing purposes. Use `!chat.openAiThreadId` to narrow for
    // TypeScripting purposes here
    if (
      !chat.openAiThreadId ||
      Joi.string().required().validate(chat.openAiThreadId).error
    ) {
      const logContext: SaraLogContext = {
        user,
        org,
        project,
        other: {
          chat,
          chatQuery,
        },
      }

      logger.errorWithContext(
        `Chat missing thread when modifying chat query`,
        logContext,
      )

      return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    }

    // Handle the logic to transition a chat query to the `CANCELLED` state
    if (reqBody.status === 'CANCELLED' && !chat.openAiThreadRunId) {
      // Just return here since we haven't actually started the thread run yet
      chatQuery.status = 'CANCELLED'
      await updateChatQuery(chatQuery)

      const logConext: SaraLogContext = {
        user,
        org,
        project,
        other: {
          chat,
          chatQuery,
        },
      }

      logger.infoWithContext(
        `'CANCELLED' chat query '${chatQuery.id}' that didn't have a thread run`,
        logConext,
      )

      return new Response(ReasonPhrases.OK, {
        status: StatusCodes.OK,
      })
    }

    if (reqBody.status === 'CANCELLED' && chat.openAiThreadRunId) {
      await cancelThreadRunForProjectGoalChatting(
        chat.openAiThreadId,
        chat.openAiThreadRunId,
      )

      chatQuery.status = 'CANCELLED'
      await updateChatQuery(chatQuery)

      chat.openAiThreadRunId = null
      await updateChat(chat)

      const logConext: SaraLogContext = {
        user,
        org,
        project,
        other: {
          chat,
          chatQuery,
        },
      }

      logger.infoWithContext(
        `'CANCELLED' chat query '${chatQuery.id}'`,
        logConext,
      )

      return new Response(ReasonPhrases.OK, {
        status: StatusCodes.OK,
      })
    }

    // Handle the logic to transition a chat query to the `QUERY_RECEIVED` state

    // Find the Assistant and start a new thread run to re-run a chat query that
    // ended in the 'ERROR' state
    const assistantMetadata: AssistantMetadata = {
      projectId: project.id,
      userName: user.email,
      orgName: org.name,
      creator: ASSISTANT_METADATA_CREATOR, // Ignore creator for search
      version: '', // Ignore version for search
      stage: process.env.SARA_STAGE || 'unknown',
    }

    let assistant = await findAssistantFromMetadata(assistantMetadata)

    if (!assistant) {
      const logContext: SaraLogContext = {
        user,
        org,
        project,
        other: {
          chat,
          chatQuery,
        },
      }

      logger.errorWithContext(
        'Failed to find assistant when modifying existing chat query',
        logContext,
      )

      return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    }

    // Now add the chat query to the existing OpenAI thread
    await addQueryToThreadForProjectGoalChatting(
      chat.openAiThreadId,
      chatQuery.id,
      chatQuery.query,
    )

    // Now start a run on the thread for the query we just added
    const threadRun = await createThreadRunForProjectGoalChatting(
      goal.name,
      goal.description === null ? undefined : goal.description,
      assistant.id,
      chat.openAiThreadId,
    )

    // Don't forget to update the OpenAI thread run ID on the chat replacing
    // the previous ID or else we won't be able to get the responses later
    chat.openAiThreadRunId = threadRun.id
    await updateChat(chat)

    // Make sure to capture details about the processing prompt used when Sara
    // answers this question and mark our chat query as submitted
    chatQuery.status = 'QUERY_SUBMITTED'
    chatQuery.querySubmittedAt = new Date()
    chatQuery.processingPrompt = threadRun.instructions

    // Blank the existing response if there was one
    chatQuery.response = null
    await updateChatQuery(chatQuery)

    logger.info(`'QUERY_SUBMITTED' for chat query '${chatQuery.id}'`)

    // Return the chat query we created to the user...
    return new Response(JSON.stringify(chatQuery), {
      status: StatusCodes.OK,
    })
  } catch (error) {
    logger.errorWithContext('Failed to update chat query', { error })

    return new Response('Failed to update chat query', {
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
