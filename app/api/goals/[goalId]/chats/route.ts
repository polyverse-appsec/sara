import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import Joi from 'joi'
import { NextAuthRequest } from 'next-auth/lib'

import { auth } from '../../../../../auth'
import getProjectPromptFileInfoIds from '../../../../../lib/polyverse/db/get-project-prompt-file-info-ids'
import {
  type ChatPartDeux,
  type ChatQueryPartDeux,
  type PromptFileInfo,
} from './../../../../../lib/data-model-types'
import { getFileInfoPartDeux } from './../../../../../lib/polyverse/backend/backend'
import getBoostProjectStatus from './../../../../../lib/polyverse/backend/get-boost-project-status'
import createChat from './../../../../../lib/polyverse/db/create-chat'
import createChatQuery from './../../../../../lib/polyverse/db/create-chat-query'
import createPromptFileInfo from './../../../../../lib/polyverse/db/create-prompt-file-info'
import deletePromptFileInfo from './../../../../../lib/polyverse/db/delete-prompt-file-info'
import getGoal from './../../../../../lib/polyverse/db/get-goal'
import getOrg from './../../../../../lib/polyverse/db/get-org'
import getProject from './../../../../../lib/polyverse/db/get-project'
import getPromptFileInfo from './../../../../../lib/polyverse/db/get-prompt-file-info'
import getUser from './../../../../../lib/polyverse/db/get-user'
import updateChat from './../../../../../lib/polyverse/db/update-chat'
import updateChatQuery from './../../../../../lib/polyverse/db/update-chat-query'
import updateGoal from './../../../../../lib/polyverse/db/update-goal'
import updateProject from './../../../../../lib/polyverse/db/update-project'
import { createBaseSaraObject } from './../../../../../lib/polyverse/db/utils'
import {
  ASSISTANT_METADATA_CREATOR,
  findAssistantFromMetadata,
  updateGlobalAssistantPrompt,
  type AssistantMetadata,
} from './../../../../../lib/polyverse/openai/assistants'
import {
  createOpenAIAssistantPromptForGoals,
  createThreadForProjectGoalChatting,
  createThreadRunForProjectGoalChatting,
} from './../../../../../lib/polyverse/openai/goalsAssistant'
import { mapPromptFileInfosToPromptFileTypes } from './../../../../../lib/polyverse/openai/utils'
import { promptFileInfosEqual } from './../../../../../lib/utils'

// 03/04/24: We set this max duration to 60 seconds during initial development
// with no real criteria to use as a starting point for the max duration. We see
// that this call is a lengthy call - possibly due to the upstream service
// calls - but in the future probably want to consider having criteria for
// setting the max duration and measuring response times/latency on routes and
// adjust them accordingly.
export const maxDuration = 60

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

    // The 3rd to the last slice ought to be the slug for the goal name
    const requestedGoalId = reqUrlSlices[reqUrlSlices.length - 2]

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

    // Validate the request body
    const reqBody = (await req.json()) as {
      query?: string
    }

    // Use `!reqBody.query` to narrow for TypeScripting purposes here
    if (
      !reqBody.query ||
      Joi.string().required().validate(reqBody.query).error
    ) {
      return new Response(`Request body is missing 'query'`, {
        status: StatusCodes.BAD_REQUEST,
      })
    }

    // Verify that the goal doesn't already have a chat
    if (!Joi.string().required().validate(goal.chatId).error) {
      return new Response('Goal already has a chat associated with it', {
        status: StatusCodes.BAD_REQUEST,
      })
    }

    // Before building up the details of the chat and the chat query objects
    // find the assistant and build up the prompt it will use since that
    // gets used in the chat query. Building up the prompt also has the
    // advantage of refreshing the cached prompt file infos.
    const assistantMetadata: AssistantMetadata = {
      projectId: project.id,
      userName: user.email,
      orgName: org.name,
      creator: ASSISTANT_METADATA_CREATOR,
      version: '', // Ignore version for search
      stage: process.env.SARA_STAGE || 'unknown',
    }

    let assistant = await findAssistantFromMetadata(assistantMetadata)

    if (!assistant) {
      console.debug(
        `Failed to find an assistant when creating a new chat for a goal for project '${project.id}'`,
      )

      return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    }

    // Update the prompt file infos that we have cached if necessary
    // Prepare to build the OpenAI Assistant for the project by getting the file
    // info from the Boost backend for the project we just created
    // TODO: We really ought to be passing in the `ID` of the `project` instance
    // but need to build more support out for using generic IDs in the backend
    // TODO: Rename to getBoostFileInfo
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

    const chatBaseSaraObject = createBaseSaraObject()
    const chatQueryBaseSaraObject = createBaseSaraObject()

    const chat: ChatPartDeux = {
      // BaseSaraObject properties
      ...chatBaseSaraObject,

      // Chat properties
      participatingUserIds: [user.id],
      goalId: goal.id,
      taskId: null,

      // Chat is essentially a linked list so point ot the first and last
      // chat query that we are preparing
      headChatQueryId: chatQueryBaseSaraObject.id,
      tailChatQueryId: chatQueryBaseSaraObject.id,

      // Set to `null` for now as we will update this later
      openAiThreadId: null,
      openAiThreadRunId: null,
    }

    const chatQuery: ChatQueryPartDeux = {
      // BaseSaraObject properties
      ...chatQueryBaseSaraObject,

      // ChatQuery properties
      chatId: chatBaseSaraObject.id,
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

      // Previous chat query ID will be null since this is the head of the
      // chat queries
      prevChatQueryId: null,

      // Next chat query ID will be null since we don't yet have any more
      // chat queries
      nextChatQueryId: null,

      fineTuningScore: null,
      fineTunedAt: null,
    }

    await createChatQuery(chatQuery)
    await createChat(chat)

    // Update any references to resources for tracking purposes
    goal.chatId = chat.id
    await updateGoal(goal)

    // Create the OpenAI Thread that the assistant will work on for this
    // run with the initial message populated based on the query we
    // received
    const thread = await createThreadForProjectGoalChatting(
      project.id,
      goal.id,
      chat.id,
      chatQuery.id,
      chatQuery.query,
    )

    chat.openAiThreadId = thread.id
    await updateChat(chat)

    // Now start a run on the thread we just created with our assistant
    const threadRun = await createThreadRunForProjectGoalChatting(
      shouldUpdateCachedPromptFileInfos
        ? promptFileInfos
        : cachedPromptFileInfos,
      goal.name,
      goal.description,
      assistant.id,
      chat.openAiThreadId,
    )

    chat.openAiThreadRunId = threadRun.id
    await updateChat(chat)

    // Make sure to capture details about the processing prompt used when Sara
    // answers this question and mark our chat query as submitted
    chatQuery.processingPrompt = threadRun.instructions
    chatQuery.status = 'QUERY_SUBMITTED'
    await updateChatQuery(chatQuery)

    // Return the chat details we created to the user...
    return new Response(JSON.stringify(chat), {
      status: StatusCodes.CREATED,
    })
  } catch (error) {
    console.error(
      `Failed creating chat for '${auth.user.username}' because: ${error}`,
    )

    return new Response('Failed to create chat', {
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
