import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import {
  BoostProjectStatus,
  BoostProjectStatusState,
} from 'lib/polyverse/backend/types/BoostProjectStatus'
import isEqual from 'lodash/isEqual'
import sortBy from 'lodash/sortBy'
import { NextAuthRequest } from 'next-auth/lib'
import { type Assistant } from 'openai/resources/beta/assistants/assistants'

import { auth } from '../../../../../auth'
import getOrg from '../../../../../lib/polyverse/db/get-org'
import getProject from '../../../../../lib/polyverse/db/get-project'
import getUser from '../../../../../lib/polyverse/db/get-user'
import authz from './../../../../../app/api/authz'
import {
  projectHealthScalarValuesByReadableValues,
  PromptFileInfo,
  type ProjectHealth,
  type ProjectHealthConfigurationState,
  type ProjectHealthStatusValue,
} from './../../../../../lib/data-model-types'
import getBoostProjectStatus from './../../../../../lib/polyverse/backend/get-boost-project-status'
import getProjectPromptFileInfos from './../../../../../lib/polyverse/backend/get-project-prompt-file-infos'
import {
  ASSISTANT_METADATA_CREATOR,
  findAssistantFromMetadata,
  getAssistant,
  type AssistantMetadata,
} from './../../../../../lib/polyverse/openai/assistants'

const createProjectHealth = (
  projectId: string,
  readableValue: ProjectHealthStatusValue,
  configurationState: ProjectHealthConfigurationState,
  message: string,
  actionableRecourse: string | null = null,
  backgroundProjectStatus: BoostProjectStatusState | undefined = undefined,
) => {
  const scalarValue = projectHealthScalarValuesByReadableValues[readableValue]

  const projectHealth: ProjectHealth = {
    projectId,
    scalarValue,
    readableValue,
    message,
    actionableRecourse,
    configurationState,
    backgroundProjectStatus,
    lastCheckedAt: new Date(),
  }

  return projectHealth
}

export const GET = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.user.email || !auth.user.id) {
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

    // The 2nd to the last slice ought to be the slug for the project ID
    const requestedProjectId = reqUrlSlices[reqUrlSlices.length - 2]

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

    let checkedBoostProjectStatus

    try {
        checkedBoostProjectStatus = await getBoostProjectStatus(
        user.email,
        org.name,
        project.id,
      )
    } catch (error: any) {
      console.error(`${auth.user.email} failed to get Boost project status for project '${project.id}' because: ${error.stack || error}`)
      checkedBoostProjectStatus = undefined
    }
    
    const boostProjectStatus = checkedBoostProjectStatus

    // For a project to be healthy we need to meet these circumstances:
    // 1) 3 files returned from
    // `GET /api/user_project/${billingOrgName}/${projectId}/data_references`
    // 2) OpenAI Assistant created
    // 3) OpenAI Assistant has 3 files attached to it
    // 4) OpenAI Assistant files match the latest returned by
    // `GET /api/user_project/${billingOrgName}/${projectId}/data_references`
    // 5) The 3 files attached to the OpenAI Assistant are completely processed
    //
    // If we deem we haven't satisfied any of the requirements for any of the
    // aforementioned steps then we ought to indicate to the client what state
    // of configuration the project is in. We ought to indicate the previous
    // step that we were able to confirm as documented here:
    // Fail Step 1) -> 'UNKNOWN'
    // Fail Step 2) -> 'VECTOR_DATA_AVAILABLE'
    // Fail Step 3) -> 'LLM_CREATED'
    // Fail Step 4) -> 'VECTOR_DATA_ATTACHED_TO_LLM'
    // Fail Step 5) -> 'VECTOR_DATA_UPDATE_AVAILABLE'
    // Pass Step 5) -> 'CONFIGURED'
    //
    // Note that the OpenAI Assistant can have 3 files attached to it but we
    // need to ensure that the Assistant has the LATEST files attached to it
    // as returned by
    // `GET /api/user_project/${billingOrgName}/${projectId}/data_references`

    // 1) Check that we are getting 3 files back from
    // `GET /api/user_project/${billingOrgName}/${projectId}/data_references`
    let promptFileInfos: PromptFileInfo[] | null = null

    try {
      promptFileInfos = await getProjectPromptFileInfos(
        user.email,
        org.name,
        project.id,
      )
    } catch (error) {
      const errMsg = `Failed to get data references for project '${project.id}' for org '${org.name}' because: ${error}`

      const projectHealth = createProjectHealth(
        project.id,
        'UNHEALTHY',
        'UNKNOWN',
        errMsg,
        null,
        boostProjectStatus,
      )

      return new Response(JSON.stringify(projectHealth), {
        status: StatusCodes.OK,
      })
    }

    if (!promptFileInfos || promptFileInfos.length !== 3) {
      const projectHealth = createProjectHealth(
        project.id,
        'UNHEALTHY',
        'UNKNOWN',
        'Data references not available',
        'Try to get data references again',
        boostProjectStatus,
      )

      return new Response(JSON.stringify(projectHealth), {
        status: StatusCodes.OK,
      })
    }

    // 2) Check that the OpenAI Assistant is created
    let assistant: Assistant | undefined = undefined

    try {
      const assistantMetadata: AssistantMetadata = {
        projectId: project.id,
        userName: user.email,
        orgName: org.name,
        creator: ASSISTANT_METADATA_CREATOR, // Ignore creator for search
        version: '', // Ignore version for search
        stage: process.env.SARA_STAGE || 'unknown',
      }

      assistant = await findAssistantFromMetadata(assistantMetadata)

      // It has been observed - although not documented in the OpenAI API docs
      // that the list of Assistants returned doesn't contain the file IDs
      // associated with them. Maybe a bug - maybe a weird design decision? If we
      // get to this point get the Assistant with a direct call instead of through
      // a list as the call to `findAssistantFromMetadata` does. The Assistant
      // returned by a direct call appears to return the file IDs attached to an
      // Assistant.
      if (assistant) {
        assistant = await getAssistant(assistant.id)
      }
    } catch (error) {
      const errMsg = `Failed to get LLM for project '${project.id}' for org '${org.name}' because: ${error}`

      const projectHealth = createProjectHealth(
        project.id,
        'UNHEALTHY',
        'UNKNOWN',
        errMsg,
        null,
        boostProjectStatus,
      )

      return new Response(JSON.stringify(projectHealth), {
        status: StatusCodes.OK,
      })
    }

    // In the case that the assistant is undefined presume that it hasn't
    // actually been created yet and advise user to refresh the project. This
    // most likely occurs as a result of not refreshing the project after it has
    // been created at:
    // `POST /api/orgs/<orgId>/projects`
    if (!assistant) {
      const projectHealth = createProjectHealth(
        project.id,
        'PARTIALLY_HEALTHY',
        'VECTOR_DATA_AVAILABLE',
        `LLM not yet created`,
        `Refresh project`,
        boostProjectStatus,
      )

      return new Response(JSON.stringify(projectHealth), {
        status: StatusCodes.OK,
      })
    }

    // 3) OpenAI Assistant has 3 files attached to it.
    if (assistant.file_ids.length !== 3) {
      const projectHealth = createProjectHealth(
        project.id,
        'PARTIALLY_HEALTHY',
        'LLM_CREATED',
        `LLM missing full file references`,
        `Refresh project`,
        boostProjectStatus,
      )

      return new Response(JSON.stringify(projectHealth), {
        status: StatusCodes.OK,
      })
    }

    // 4) OpenAI Assistant files match the latest returned by
    // `GET /api/user_project/${billingOrgName}/${projectId}/data_references`
    //
    // Any changes to the files on the backend will cause new file IDs to be
    // generated so just check that the Assistant has the same file IDs.
    const sortedAssistantFileIds = sortBy(
      assistant.file_ids.map((fileId) => fileId),
    )
    const sortedBoostFileIds = sortBy(
      promptFileInfos.map((promptFileInfo) => promptFileInfo.id),
    )
    const fileIdsEqual = isEqual(sortedAssistantFileIds, sortedBoostFileIds)

    if (!fileIdsEqual) {
      const projectHealth = createProjectHealth(
        project.id,
        'PARTIALLY_HEALTHY',
        'VECTOR_DATA_ATTACHED_TO_LLM',
        `File references need to be updated for the LLM`,
        `Refresh project`,
        boostProjectStatus,
      )

      return new Response(JSON.stringify(projectHealth), {
        status: StatusCodes.OK,
      })
    }

    // 5) The 3 files attached to the OpenAI Assistant are completely processed
    try {
      // Rather than check all of the file states just check that the project is
      // fully synchronized
      if (boostProjectStatus?.status !== BoostProjectStatus.Synchronized) {
        const projectHealth = createProjectHealth(
          project.id,
          'PARTIALLY_HEALTHY',
          'VECTOR_DATA_UPDATE_AVAILABLE',
          `LLM not synchronized`,
          `Refresh project`,
          boostProjectStatus,
        )

        return new Response(JSON.stringify(projectHealth), {
          status: StatusCodes.OK,
        })
      }
    } catch (error) {
      const errMsg = `Failed to get LLM status for project '${project.id}' for org '${org.name}' because: ${error}`

      const projectHealth = createProjectHealth(
        project.id,
        'UNHEALTHY',
        'UNKNOWN',
        errMsg,
        null,
        boostProjectStatus,
      )

      return new Response(JSON.stringify(projectHealth), {
        status: StatusCodes.OK,
      })
    }

    // At this point we have passed all of our health check so signal to the
    // user that the project is healthy
    const projectHealth = createProjectHealth(
      project.id,
      'HEALTHY',
      'CONFIGURED',
      'Sara LLM configured',
      null,
      boostProjectStatus
    )

    // Return a healthy project status
    return new Response(JSON.stringify(projectHealth), {
      status: StatusCodes.OK,
    })
  } catch (error) {
    console.error(
      `Failed fetching project health for '${auth.user.email}' because: ${error}`,
    )

    return new Response('Failed to fetch project health', {
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
