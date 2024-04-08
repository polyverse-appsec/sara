import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { NextAuthRequest } from 'next-auth/lib'
import { Assistant } from 'openai/resources/beta/assistants/assistants'

import { auth } from '../../../../../auth'
import getProjectPromptFileInfoIds from '../../../../../lib/polyverse/db/get-project-prompt-file-info-ids'
import authz from './../../../../../app/api/authz'
import {
  getBoostOrgUserStatus,
} from './../../../../../lib/polyverse/backend/backend'
import getProjectPromptFileInfos from './../../../../../lib/polyverse/backend/get-project-prompt-file-infos'
import getBoostProjectStatus from './../../../../../lib/polyverse/backend/get-boost-project-status'
import createPromptFileInfo from './../../../../../lib/polyverse/db/create-prompt-file-info'
import deletePromptFileInfo from './../../../../../lib/polyverse/db/delete-prompt-file-info'
import getOrg from './../../../../../lib/polyverse/db/get-org'
import getProject from './../../../../../lib/polyverse/db/get-project'
import getPromptFileInfo from './../../../../../lib/polyverse/db/get-prompt-file-info'
import getUser from './../../../../../lib/polyverse/db/get-user'
import updateProject from './../../../../../lib/polyverse/db/update-project'
import {
  ASSISTANT_METADATA_CREATOR,
  createAssistant,
  findAssistantFromMetadata,
  getVersion,
  updateGlobalAssistantPrompt,
  type AssistantMetadata,
} from './../../../../../lib/polyverse/openai/assistants'
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

  if (!auth || !auth.user.email || !auth.user.id) {
    return new Response(ReasonPhrases.UNAUTHORIZED, {
      status: StatusCodes.UNAUTHORIZED,
    })
  }

  // TODO: Should be able to do Dynamic Route segments as documented:
  // https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
  // Problem is our Auth wrapper doesn't like it. See if we can figure
  // out a way to move to this pattern.
  const reqUrl = new URL(req.url)
  const reqUrlSlices = reqUrl.toString().split('/')

  // The 2nd to the last slice ought to be the slug for the project ID
  const requestedProjectId = reqUrlSlices[reqUrlSlices.length - 2]

  try {
    const user = await getUser(auth.user.email)
    const project = await getProject(requestedProjectId)
    const org = await getOrg(project.orgId)

    try {
      authz.userListedOnOrg(org, user.id)
      authz.orgListedOnUser(user, org.id)
      authz.userListedOnProject(project, user.id)
    } catch (error) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // 03/12/24: For now we are blocking project refresh unless you have the
    // GitHub App installed for the org you are trying to create a project under
    // and you are a premium user. In the future we will more intelligently
    // allow projects to be refreshed and thus making this workflow more
    // permissive.
    const boostOrgUserStatus = await getBoostOrgUserStatus(org.name, user.email)

    // If the `username` data member shows up on the user status that means
    // the user has the GitHub App installed.
    const gitHubAppInstalled =
      boostOrgUserStatus.backgroundAnalysisAuthorized !== undefined &&
      boostOrgUserStatus.backgroundAnalysisAuthorized

    if (!gitHubAppInstalled) {
      console.log(
        `User with email '${user.email}' for org '${org.id}' tried to create a project but doesn't have the GitHub app installed`,
      )
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    const isPremiumUser =
      boostOrgUserStatus.plan && boostOrgUserStatus.plan == 'premium'

    if (!isPremiumUser) {
      console.log(
        `User with email '${user.email}' for org '${org.id}' tried to create a project but isn't a premium user`,
      )

      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // Start the refresh processing. Our expectation is that the data for the
    // project has been created on the Boost backend when making a
    // `POST /api/user_project/${orgId}/${projectName}`

    // Start by gathering the file info for the project. If for some reason we
    // don't have the 3 file infos for the project (blueprint, AI spec, project
    // source) then fail as we won't refresh the project without them.
    const promptFileInfos = await getProjectPromptFileInfos(
      user.email,
      org.name,
      project.id,
    )

    if (!promptFileInfos || promptFileInfos.length !== 3) {
      const logMsg =
      promptFileInfos.length < 3
          ? `Failing refresh for project '${project.id}' because got less than the 3 requisite file infos - total received: '${promptFileInfos.length}'`
          : `Failing refresh for project '${
              project.id
            }' because got more than the 3 requisite file infos - total received: '${
              promptFileInfos.length
            }' - file info dump: ${JSON.stringify(promptFileInfos)}`

      // Getting more than 3 file infos is concerning - make sure to log it out as an error
      if (promptFileInfos.length > 3) {
        console.error(logMsg)
      }

      return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    }

    promptFileInfos.forEach((promptFileInfo) => {
      promptFileInfo.parentProjectId = project.id

      // It isn't obvious what is going on here. When we make a call to the
      // Boost backend for `GET data_references` the objects returned also
      // contain the `lastUpdatedAt` property. Since we are persisting this info
      // in our K/V set the `createdAt` value to that of `lastUpdatedAt` so it
      // doesn't appear wonky in our data (i.e. that `createdAt` is more recent
      // than `lastUpdatedAt`).
      promptFileInfo.createdAt = promptFileInfo.lastUpdatedAt
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

    // Before we proceed to update prompts lets make sure we have an Assistant
    // in the first place. Remember that this REST API is expected to be invoked
    // after simply creating a shell of the project data in Sara and Boost.
    let assistant: Assistant | undefined = undefined
    const assistantMetadata: AssistantMetadata = {
      projectId: project.id,
      userName: user.email,
      orgName: org.name,
      // Will be ignored when searching
      creator: ASSISTANT_METADATA_CREATOR,
      // Will be ignored when searching
      version: getVersion(),
      stage: process.env.SARA_STAGE || 'unknown',
    }

    try {
      assistant = await findAssistantFromMetadata(assistantMetadata)
    } catch (error) {
      console.debug(
        `Failed making a request for the OpenAI Assistant for project '${project.id}' because: ${error}`,
      )

      return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      })
    }

    // Make sure to get the Boost project status which will be used for updating
    // the global Assistant prompt to allow Sara to provide a level of
    // confidence in her answers
    const boostProjectStatus = await getBoostProjectStatus(
      user.email,
      org.name,
      project.id,
    )

    // Now actually create the Assistant if it doesn't exist or update its
    // prompt if it does. Note that when we update the prompt we make it more
    // generic vs. the prompt we would provide it when processing a goal or a
    // task.
    if (!assistant) {
      // TODO: After we switch over to the new UI/UX workflows change this signature to take
      // PromptFileInfo
      await createAssistant(
        promptFileInfos,
        assistantMetadata,
        project,
        boostProjectStatus,
      )
    } else {
      await updateGlobalAssistantPrompt(
        shouldUpdateCachedPromptFileInfos
          ? promptFileInfos
          : cachedPromptFileInfos,
        assistantMetadata,
        project,
        boostProjectStatus,
      )
    }

    // We cache after creating/updating the OpenAI Assistant so that in the
    // event that we fail to update our cache of file info we will always retry
    // updating the Assistant and thus the cache again on subsequent invocations
    // of this REST API.
    if (shouldUpdateCachedPromptFileInfos) {
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

    // Don't forget to indicate that we refreshed the project
    project.lastRefreshedAt = new Date()
    await updateProject(project)

    // Return the refreshed project to the user...
    return new Response(JSON.stringify(project), {
      status: StatusCodes.OK,
    })
  } catch (error) {
    console.error(
      `Failed refreshing project '${requestedProjectId}' for '${auth.user.name}' because: ${error}`,
    )

    return new Response('Failed to create project', {
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
