import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { NextAuthRequest } from 'next-auth/lib'
import Joi from 'joi'

import { auth } from '../../../../../../../auth'

import getChat from './../../../../../../../lib/polyverse/db/get-chat'
import getChatQuery from './../../../../../../../lib/polyverse/db/get-chat-query'
import getGoal from './../../../../../../../lib/polyverse/db/get-goal'
import getOrg from './../../../../../../../lib/polyverse/db/get-org'
import getProject from './../../../../../../../lib/polyverse/db/get-project'
import getUser from './../../../../../../../lib/polyverse/db/get-user'
import getChatQueryRangeFromChat from './../../../../../../../lib/polyverse/db/get-chat-query-range-from-chat'
import updateChatQuery from './../../../../../../../lib/polyverse/db/update-chat-query'

import {
  getChatQueryResponseFromThread,
  getThreadRunForProjectGoalChatting,
  handleRequiresActionStatusForProjectGoalChatting
} from './../../../../../../../lib/polyverse/openai/goalsAssistant'

// 03/04/24: We set this max duration to 60 seconds during initial development
// with no real criteria to use as a starting point for the max duration. We see
// that this call is a lengthy call - possibly due to the upstream service
// calls - but in the future probably want to consider having criteria for
// setting the max duration and measuring response times/latency on routes and
// adjust them accordingly.
export const maxDuration = 60

export const GET = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.accessToken || !auth.user.email) {
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

    // The 2nd to the last slice ought to be the slug for the chat ID
    const requestedChatId = reqUrlSlices[reqUrlSlices.length - 2]

    // The 4th to the last slice ought to be the slug for the chat ID
    const requestedGoalId = reqUrlSlices[reqUrlSlices.length - 4]

    // AuthZ: Check that the user is listed as a member on the org that owns
    // the goal
    const goal = await getGoal(requestedGoalId)
    const org = await getOrg(goal.orgId)

    if (!org.userIds || org.userIds.length === 0) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    const user = await getUser(auth.user.email)

    const foundUserIdOnOrg = org.userIds.find(
      (userId) => userId === user.id,
    )

    if (!foundUserIdOnOrg) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // AuthZ: Check that the user lists the org as something they are a
    // member of
    if (!user.orgIds || user.orgIds.length === 0) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    const foundOrgId = user.orgIds.find((orgId) => orgId === org.id)

    if (!foundOrgId) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // AuthZ: Check that the project the goal is associated with lists the
    // user
    const project = await getProject(goal.parentProjectId)

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

    // Get the last chat query in the linked list of queries. If already has a
    // response received or is in an error state then just return the chat
    // queries instead of doing OpenAI processing.
    const chat = await getChat(requestedChatId)

    // If we get here without the tail chat query ID then something else really
    // broke somewhere. :( Use `!chat.tailChatQueryId` to narrow for
    // TypeScripting purposes here
    if (
      !chat.tailChatQueryId ||
      Joi.string().required().validate(chat.tailChatQueryId).error
    ) {
      console.error(`Checking chat '${chat.id}' for the tail chat query but none was found`)

      return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    }

    const tailChatQuery = await getChatQuery(chat.tailChatQueryId)

    // TODO: Consider what I want the DX to be if the chat query is in an 'ERROR' status
    if (tailChatQuery.status !== 'QUERY_SUBMITTED') {
      // This REST API doesn't support paging yet but we are returning results
      // like we do. Something for us to build on.
      const chatQueries = await getChatQueryRangeFromChat(chat.id)

      return new Response(JSON.stringify(chatQueries), {
        status: StatusCodes.OK,
      })
    }

    // Validate that there is an OpenAI Thread associated with the goal for
    // processing purposes. Use `!chat.openAiThreadId` to narrow for
    // TypeScripting purposes here
    if (
      !chat.openAiThreadId ||
      Joi.string().required().validate(chat.openAiThreadId).error
    ) {
      return new Response(`No chat for this goal has been initiated yet`, {
        status: StatusCodes.BAD_REQUEST,
      })
    }

    // Use `!chat.openAiThreadRunId` to narrow for TypeScripting purposes here
    if (
      !chat.openAiThreadRunId ||
      Joi.string().required().validate(chat.openAiThreadRunId).error
    ) {
      return new Response(`Chat hasn't had any processing performed on it yet'`, {
        status: StatusCodes.BAD_REQUEST,
      })
    }

    // While this shouldn't happen validate that we have a tail chat query ID.
    // If we don't something really wrong happened if we got here expecting it
    // to exist. Use `!chat.tailChatQueryId` to narrow for TypeScripting
    // purposes here
    if (
      !chat.tailChatQueryId ||
      Joi.string().required().validate(chat.tailChatQueryId).error
    ) {
      console.error(`Chat doesn't have a tail query associated with it`)

      return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    }

    // Since we are an async API we will have to process the theads each time
    // the data is requested. This ought to really be handed off to a background
    // processing thread.
    const threadRun = await getThreadRunForProjectGoalChatting(
      chat.openAiThreadId,
      chat.openAiThreadRunId
    )

    const { status: threadRunStatus } = threadRun

    // If we require some action to be taken respond to the client that we are
    // processing. This is a bad result from a UX perspective but right now we
    // have no way of background processing so this will have to suffice for
    // now.
    if (threadRunStatus === 'requires_action') {
      await handleRequiresActionStatusForProjectGoalChatting(threadRun, goal.id)

      // We tried to use the status code '102 Processing' in the response but
      // NextJS (?) errored on the range and said it needed to be 200-599. Just
      // return an OK response with the tail query still saying its processed.
      // Then gather the a range of chat queries from the chat and return it to
      // the user. This REST API doesn't support paging yet but we are returning
      // results like we do. Something for us to build on.
      const chatQueries = await getChatQueryRangeFromChat(chat.id)
      
      return new Response(JSON.stringify(chatQueries), {
        status: StatusCodes.OK
      })
    } else if (threadRunStatus === 'failed') {
      // If we hit a failed thread run state then we need to mark the last chat
      // query in the chat as in an error state and give the reason why.

      // If we get here we expect that most recent query in the chat to be
      // submitted. If it isn't then something is really wrong.
      if (tailChatQuery.status !== 'QUERY_SUBMITTED') {
        console.error(`Most recent chat query isn't in the 'QUERY_SUBMITTED' state when trying to handle an OpenAI Thread Run failure`)

        return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
          status: StatusCodes.INTERNAL_SERVER_ERROR,
        })
      }

      tailChatQuery.status = 'ERROR'

      if (threadRun.last_error) {
        tailChatQuery.errorText = threadRun.last_error.message
      } else {
        console.debug(`OpenAI Thread Run in a 'failed' state but hasn't provided 'last_error' - Setting 'errorText' to unknown for most recent chat query`)

        tailChatQuery.errorText = 'Unknown'
      }

      // Don't forget to update the chat query status
      await updateChatQuery(tailChatQuery)

      // Rather than process more messages while we are in an error state lets
      // simplify right now but just responding with an error. In the future we
      // can possibly do best effort processing of messages while in an error
      // state and that is a great - less restrictive improvement - on our REST
      // API.
      return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
        status: StatusCodes.INTERNAL_SERVER_ERROR
      })
    } else if (threadRunStatus === 'in_progress') {
      // We tried to use the status code '102 Processing' in the response but
      // NextJS (?) errored on the range and said it needed to be 200-599. Just
      // return an OK response with the tail query still saying its processed.
      // Then gather the a range of chat queries from the chat and return it to
      // the user. This REST API doesn't support paging yet but we are returning
      // results like we do. Something for us to build on.
      const chatQueries = await getChatQueryRangeFromChat(chat.id)
      
      return new Response(JSON.stringify(chatQueries), {
        status: StatusCodes.OK
      })
    } else if (threadRunStatus !== 'completed') {
      console.error(`Chat '${chat.id}' was requested and we encountered an unhandled thread run status of '${threadRunStatus}'`)

      return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
        status: StatusCodes.INTERNAL_SERVER_ERROR
      })
    }

    // If we get to this point we must be dealing with a thread run in the
    // 'completed' status. If so then gather the messages from OpenAI and update
    // the most recent chat query.
    const chatQueryResponse = await getChatQueryResponseFromThread(chat.openAiThreadId, chat.tailChatQueryId)
    tailChatQuery.response = chatQueryResponse
    tailChatQuery.status = 'RESPONSE_RECEIVED'

    await updateChatQuery(tailChatQuery)

    // Then gather the a range of chat queries from the chat and return it to
    // the user. This REST API doesn't support paging yet but we are returning
    // results like we do. Something for us to build on.
    const chatQueries = await getChatQueryRangeFromChat(chat.id)

    return new Response(JSON.stringify(chatQueries), {
      status: StatusCodes.OK,
    })
  } catch (error) {
    console.error(
      `Failed fetching chat queries for '${auth.user.username}' because: ${error}`,
    )

    return new Response('Failed to fetch chat queries', {
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
