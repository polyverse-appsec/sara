import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import Joi from 'joi'
import createChatQuery from 'lib/polyverse/db/create-chat-query'
import updateChat from 'lib/polyverse/db/update-chat'
import { NextAuthRequest } from 'next-auth/lib'

import { auth } from '../../../../../../../auth'
import getProjectPromptFileInfoIds from '../../../../../../../lib/polyverse/db/get-project-prompt-file-info-ids'
import {
  type ChatQueryPartDeux,
  type PromptFileInfo,
} from './../../../../../../../lib/data-model-types'
import { getFileInfoPartDeux } from './../../../../../../../lib/polyverse/backend/backend'
import createPromptFileInfo from './../../../../../../../lib/polyverse/db/create-prompt-file-info'
import deletePromptFileInfo from './../../../../../../../lib/polyverse/db/delete-prompt-file-info'
import getChat from './../../../../../../../lib/polyverse/db/get-chat'
import getChatQuery from './../../../../../../../lib/polyverse/db/get-chat-query'
import getChatQueryRangeFromChat from './../../../../../../../lib/polyverse/db/get-chat-query-range-from-chat'
import getGoal from './../../../../../../../lib/polyverse/db/get-goal'
import getOrg from './../../../../../../../lib/polyverse/db/get-org'
import getProject from './../../../../../../../lib/polyverse/db/get-project'
import getPromptFileInfo from './../../../../../../../lib/polyverse/db/get-prompt-file-info'
import getUser from './../../../../../../../lib/polyverse/db/get-user'
import updateChatQuery from './../../../../../../../lib/polyverse/db/update-chat-query'
import updateProject from './../../../../../../../lib/polyverse/db/update-project'
import { createBaseSaraObject } from './../../../../../../../lib/polyverse/db/utils'
import {
  ASSISTANT_METADATA_CREATOR,
  findAssistantFromMetadata,
  updateGlobalAssistantPrompt,
  type AssistantMetadata,
} from './../../../../../../../lib/polyverse/openai/assistants'
import {
  addQueryToThreadForProjectGoalChatting,
  createOpenAIAssistantPromptForGoals,
  createThreadRunForProjectGoalChatting,
  getChatQueryResponseFromThread,
  getThreadRunForProjectGoalChatting,
  handleRequiresActionStatusForProjectGoalChatting,
} from './../../../../../../../lib/polyverse/openai/goalsAssistant'
import { mapPromptFileInfosToPromptFileTypes } from './../../../../../../../lib/polyverse/openai/utils'
import { promptFileInfosEqual } from './../../../../../../../lib/utils'
import getBoostProjectStatus from './../../../../../../../lib/polyverse/backend/get-boost-project-status'

// 03/04/24: We set this max duration to 60 seconds during initial development
// with no real criteria to use as a starting point for the max duration. We see
// that this call is a lengthy call - possibly due to the upstream service
// calls - but in the future probably want to consider having criteria for
// setting the max duration and measuring response times/latency on routes and
// adjust them accordingly.
export const maxDuration = 60

// TODO: Provide more informative error response bodies. Maybe akin to what the Boost backend sends

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

    const foundUserIdOnOrg = org.userIds.find((userId) => userId === user.id)

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

    // Get the last chat query in the linked list of queries. Verify that the
    // last chat query has received a response. If not then fail the request
    // as we don't want users to add chat queries until we have received a
    // response to the previous one.
    const chat = await getChat(requestedChatId)

    // If we get here without the tail chat query ID then something else really
    // broke somewhere. :( Use `!chat.tailChatQueryId` to narrow for
    // TypeScripting purposes here
    if (
      !chat.tailChatQueryId ||
      Joi.string().required().validate(chat.tailChatQueryId).error
    ) {
      console.error(
        `Checking chat '${chat.id}' for the tail chat query but none was found`,
      )

      return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    }

    const tailChatQuery = await getChatQuery(chat.tailChatQueryId)

    if (tailChatQuery.status !== 'RESPONSE_RECEIVED') {
      return new Response(ReasonPhrases.BAD_REQUEST, {
        status: StatusCodes.BAD_REQUEST,
      })
    }

    // Validate the request body
    const reqBody = (await req.json()) as {
      prevChatQueryId?: string
      query?: string
    }

    // If we get here without the tail chat query ID then something else really
    // broke somewhere. :( Use `!reqBody.prevChatQueryId` to narrow for
    // TypeScripting purposes here

    // We check for the previous chat query ID as a way to crudely synchronize
    // the chat experience. This way only someone who knows what that last chat
    // query was can actually add a new message onto it. Use
    // `!reqBody.prevChatQueryId` to narrow for TypeScripting purposes here
    if (
      !reqBody.prevChatQueryId ||
      Joi.string().required().validate(reqBody.prevChatQueryId).error
    ) {
      console.error(`Previous chat query wasn't identified`)

      return new Response(ReasonPhrases.BAD_REQUEST, {
        status: StatusCodes.BAD_REQUEST,
      })
    }

    if (
      !reqBody.query ||
      Joi.string().required().validate(reqBody.query).error
    ) {
      console.error(`No chat query was provided`)

      return new Response(ReasonPhrases.BAD_REQUEST, {
        status: StatusCodes.BAD_REQUEST,
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

    // Validate that the most recent chat query matches what the user supplied
    if (chat.tailChatQueryId !== reqBody.prevChatQueryId) {
      console.error(
        `The ID of the previous chat query doesn't match that with the ID of the most recent chat query made`,
      )

      return new Response(ReasonPhrases.BAD_REQUEST, {
        status: StatusCodes.BAD_REQUEST,
      })
    }

    // TODO: DRY up this logic that is used to update the prompt and prompt
    // file infos in several workflows
    // Before building up the details of the chat and the chat query objects
    // find the assistant and build up the prompt it will use since that
    // gets used in the chat query. Building up the prompt also has the
    // advantage of refreshing the cached prompt file infos.
    const assistantMetadata: AssistantMetadata = {
      projectId: project.id,
      userName: user.username,
      orgName: org.name,
      creator: ASSISTANT_METADATA_CREATOR, // Ignore creator for search
      version: '', // Ignore version for search
      stage: process.env.SARA_STAGE || '',
    }

    let assistant = await findAssistantFromMetadata(assistantMetadata)

    if (!assistant) {
      console.debug(
        `Failed to find an assistant when creating a new chat query for a chat with an ID of '${chat.id}'`,
      )

      return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    }

    // Update the prompt file infos that we have cached if necessary
    // Prepare to build the OpenAI Assistant for the project by getting the file
    // info from the Boost backend for the project we just created
    const boostFileInfos = await getFileInfoPartDeux(
      org.name,
      project.name,
      user.email,
    )

    // For now we need to convert the file info we get from Boost into instances
    // of `PromptFileInfo` since we rely on persisting data that first has a
    // basic structure based off of `BaseSaraObject` types.
    const promptFileInfos = boostFileInfos.map((boostFileInfo) => {
      const promptFileInfoBaseSaraObject = createBaseSaraObject()

      const promptFileInfo: PromptFileInfo = {
        // BaseSareObject properties...
        ...promptFileInfoBaseSaraObject,

        // PromptFileInfo properties...
        //
        // Note that spreading out the properties of Boost file info which is
        // an instance of `ProjectDataReference` is replacing the ID that would
        // be created as a result of spreading out the `BaseSaraObject`
        ...boostFileInfo,
        parentProjectId: project.id,
      }

      // It isn't obvious what is going on here. When we make a call to the
      // Boost backend for `GET data_references` the objects returned also
      // contain the `lastUpdatedAt` property. Since we are persisting this info
      // in our K/V set the `createdAt` value to that of `lastUpdatedAt` so it
      // doesn't appear wonky in our data (i.e. that `createdAt` is more recent
      // than `lastUpdatedAt`).
      promptFileInfo.createdAt = promptFileInfo.lastUpdatedAt

      return promptFileInfo
    })

    // Get our cached file infos to see if we ought to update our prompt
    const cachedPromptFileInfoIds = await getProjectPromptFileInfoIds(
      project.id,
    )

    const cachedPromptFileInfoPromises = cachedPromptFileInfoIds.map(
      (cachedPromptFileInfoId) => getPromptFileInfo(cachedPromptFileInfoId),
    )

    const cachedPromptFileInfos = await Promise.all(
      cachedPromptFileInfoPromises,
    )

    const shouldUpdateCachedPromptFileInfos = !promptFileInfosEqual(
      cachedPromptFileInfos,
      promptFileInfos,
    )

    // Make sure to get the Boost project status which will be used for updating
    // the global Assistant prompt to allow Sara to provide a level of
    // confidence in her answers 
    const boostProjectStatus = await getBoostProjectStatus(
      user.email,
      org.name,
      project.name,
    )

    if (shouldUpdateCachedPromptFileInfos) {
      // Since we are updating our cached file infos lets also update the
      // generalized prompt of the OpenAI Assistant. Remember that when we
      // perform a Run on a Thread we will override these generalized
      // instructions with ones more specific to contextualizing goals.
      assistant = await updateGlobalAssistantPrompt(
        promptFileInfos,
        boostProjectStatus,
        assistantMetadata,
      )

      // If we need to update our prompt start by updating the cache of our
      // prompt file infos. Start by deleting the existing cached prompt
      // file infos.
      const deleteCachedPromptFileInfoPromises = cachedPromptFileInfos.map(
        (cachedPromptFileInfo) =>
          deletePromptFileInfo(
            cachedPromptFileInfo.id,
            cachedPromptFileInfo.parentProjectId,
          ),
      )

      await Promise.all(deleteCachedPromptFileInfoPromises)

      // Now cache the new set of prompt file infos.
      const createPromptFileInfoPromises = promptFileInfos.map(
        (promptFileInfo) => createPromptFileInfo(promptFileInfo),
      )

      await Promise.all(createPromptFileInfoPromises)
    }

    console.debug(
      `Updated assistant for project goal contextualization with a goal ID of '${
        goal.id
      }': ${JSON.stringify(assistant)}`,
    )

    // Don't forget to indicate that we refreshed the project
    project.lastRefreshedAt = new Date()
    await updateProject(project)

    const chatQueryBaseSaraObject = createBaseSaraObject()

    const newTailChatQuery: ChatQueryPartDeux = {
      // BaseSaraObject properties
      ...chatQueryBaseSaraObject,

      // ChatQuery properties
      chatId: chat.id,
      queryingUserId: user.id,

      query: reqBody.query,
      response: null,
      // We will capture the processing prompt that was used from the Thread Run
      // below when we change `status` states
      processingPrompt: '',

      status: 'QUERY_RECEIVED',
      errorText: null,

      querySubmittedAt: chatQueryBaseSaraObject.createdAt,
      responseReceivedAt: null,

      // Will update this shortly below...
      prevChatQueryId: null,

      // Next chat query ID will be null since this will be the latest chat
      // query...
      nextChatQueryId: null,

      fineTuningScore: null,
      fineTunedAt: null,
    }

    // Carefully update the pointers to our linked list items here before
    // writing anything to our data store...
    //
    // * The current chat query referenced by `chat.tailQueryId` needs to have
    // its data member `nextChatQueryId` point to the ID of the newly created
    // chat query instance
    // * The newly created chat query instance needs to have its data member
    // `prevChatQueryId` point to the ID of the current chat query referenced
    // by `chat.tailQueryId`
    // * `chat.tailQueryId` needs to point to the ID of the newly created chat
    // query instance
    tailChatQuery.nextChatQueryId = newTailChatQuery.id
    newTailChatQuery.prevChatQueryId = tailChatQuery.id
    chat.tailChatQueryId = newTailChatQuery.id

    await createChatQuery(newTailChatQuery)
    await updateChatQuery(tailChatQuery)
    await updateChat(chat)

    // Now add the chat query to the existing OpenAI thread
    await addQueryToThreadForProjectGoalChatting(
      chat.openAiThreadId,
      newTailChatQuery.id,
      newTailChatQuery.query,
    )

    // Now start a run on the thread for the query we just added
    const threadRun = await createThreadRunForProjectGoalChatting(
      shouldUpdateCachedPromptFileInfos
        ? promptFileInfos
        : cachedPromptFileInfos,
      goal.name,
      goal.description,
      assistant.id,
      chat.openAiThreadId,
    )

    // Don't forget to update the OpenAI thread run ID on the chat replacing
    // the previous ID or else we won't be able to get the responses later
    chat.openAiThreadRunId = threadRun.id
    await updateChat(chat)

    // Make sure to capture details about the processing prompt used when Sara
    // answers this question and mark our chat query as submitted
    newTailChatQuery.processingPrompt = threadRun.instructions
    newTailChatQuery.status = 'QUERY_SUBMITTED'
    await updateChatQuery(newTailChatQuery)

    // Return the chat query we created to the user...
    return new Response(JSON.stringify(newTailChatQuery), {
      status: StatusCodes.CREATED,
    })
  } catch (error) {
    console.error(
      `Failed creating chat query for '${auth.user.username}' because: ${error}`,
    )

    return new Response('Failed to create project', {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    })
  }
}) as any

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

    const foundUserIdOnOrg = org.userIds.find((userId) => userId === user.id)

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

    // Get the last chat query in the linked list of queries. If it already has
    // a response received or is in an error state then just return the chat
    // queries instead of doing OpenAI processing.
    const chat = await getChat(requestedChatId)

    // If we get here without the tail chat query ID then something else really
    // broke somewhere. :( Use `!chat.tailChatQueryId` to narrow for
    // TypeScripting purposes here
    if (
      !chat.tailChatQueryId ||
      Joi.string().required().validate(chat.tailChatQueryId).error
    ) {
      console.error(
        `Checking chat '${chat.id}' for the tail chat query but none was found`,
      )

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
      return new Response(
        `Chat hasn't had any processing performed on it yet'`,
        {
          status: StatusCodes.BAD_REQUEST,
        },
      )
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
      chat.openAiThreadRunId,
    )

    const { status: threadRunStatus } = threadRun

    // If we require some action to be taken respond to the client that we are
    // processing. This is a bad result from a UX perspective but right now we
    // have no way of background processing so this will have to suffice for
    // now.
    if (threadRunStatus === 'requires_action') {
      await handleRequiresActionStatusForProjectGoalChatting(
        threadRun,
        goal.id,
        org.id,
      )

      // We tried to use the status code '102 Processing' in the response but
      // NextJS (?) errored on the range and said it needed to be 200-599. Just
      // return an OK response with the tail query still saying its processed.
      // Then gather the a range of chat queries from the chat and return it to
      // the user. This REST API doesn't support paging yet but we are returning
      // results like we do. Something for us to build on.
      const chatQueries = await getChatQueryRangeFromChat(chat.id)

      return new Response(JSON.stringify(chatQueries), {
        status: StatusCodes.OK,
      })
    } else if (threadRunStatus === 'failed') {
      // If we hit a failed thread run state then we need to mark the last chat
      // query in the chat as in an error state and give the reason why.

      // If we get here we expect that most recent query in the chat to be
      // submitted. If it isn't then something is really wrong.
      if (tailChatQuery.status !== 'QUERY_SUBMITTED') {
        console.error(
          `Most recent chat query isn't in the 'QUERY_SUBMITTED' state when trying to handle an OpenAI Thread Run failure`,
        )

        return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
          status: StatusCodes.INTERNAL_SERVER_ERROR,
        })
      }

      tailChatQuery.status = 'ERROR'

      if (threadRun.last_error) {
        tailChatQuery.errorText = threadRun.last_error.message
      } else {
        console.debug(
          `OpenAI Thread Run in a 'failed' state but hasn't provided 'last_error' - Setting 'errorText' to unknown for most recent chat query`,
        )

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
        status: StatusCodes.INTERNAL_SERVER_ERROR,
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
        status: StatusCodes.OK,
      })
    } else if (threadRunStatus !== 'completed') {
      console.error(
        `Chat '${chat.id}' was requested and we encountered an unhandled thread run status of '${threadRunStatus}'`,
      )

      return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    }

    // If we get to this point we must be dealing with a thread run in the
    // 'completed' status. If so then gather the messages from OpenAI and update
    // the most recent chat query.
    const chatQueryResponse = await getChatQueryResponseFromThread(
      chat.openAiThreadId,
      chat.tailChatQueryId,
    )
    tailChatQuery.response = chatQueryResponse
    tailChatQuery.status = 'RESPONSE_RECEIVED'

    await updateChatQuery(tailChatQuery)

    // Then gather the a range of chat queries from the chat and return it to
    // the user. This REST API doesn't support paging yet but we are returning
    // results like we do. Something for us to build on.
    const chatQueries = await getChatQueryRangeFromChat(chat.id)

    // Strip out the prompt that was used to generate the response for trade
    // secret purposes
    const sanitizedChatQueries = chatQueries.map((chatQuery) => {
      delete chatQuery.prompt
      return chatQuery
    })

    return new Response(JSON.stringify(sanitizedChatQueries), {
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
