import { resolve } from 'path'
import { NextAuthRequest } from 'next-auth/lib'

import { configAssistantForProject } from './../../../../app/_actions/config-assistant-for-project'
import { createProjectOnSara } from './../../../../app/_actions/create-project-on-sara'
import { getFileInfoForProject } from './../../../../app/_actions/get-file-info-for-repo'
import { auth } from './../../../../auth'
import {
  ProjectDataReference,
  User,
  type Organization,
  type Repository,
} from './../../../../lib/data-model-types'
import {
  createProject as createProjectOnBoost,
  postFileInfoToGetFileInfo,
} from './../../../../lib/polyverse/backend/backend'

// 02/29/24: Set for 90 seconds for debugging purposes when timing out on using
// the `createProject` server action (which is 15 seconds by default). Possibly
// in the future we will modify this as we learn more.
export const maxDuration = 90

async function getFileInfoWithRetry(
  name: string,
  orgId: string,
  user: User,
): Promise<ProjectDataReference[]> {
  return new Promise((resolve, reject) => {
    let attempt = 0
    const maxAttempts = 6 // Limit the number of retries to prevent infinite loops

    const makeAttempt = async () => {
      try {
        const fileInfos = await getFileInfoForProject(name, orgId, user)
        console.log(`Found ${fileInfos.length} items.`)
        if (fileInfos.length === 3) {
          resolve(fileInfos) // Got the expected number of files, resolve the promise
        } else {
          attempt++
          if (attempt < maxAttempts) {
            // Schedule the next attempt in 2 seconds
            setTimeout(makeAttempt, 5000)
          } else {
            reject(new Error('Max attempts reached without success')) // Failed too many times
          }
        }
      } catch (error) {
        console.error(error)
        reject(error)
      }
    }

    makeAttempt()
  })
}

export const POST = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.accessToken || !auth.user.email || !auth.user.id) {
    return new Response('Unauthorized', {
      status: 401,
    })
  }

  try {
    const { name, primaryDataSource, secondaryDataSources, org } =
      (await req.json()) as {
        name: string
        primaryDataSource: Repository
        secondaryDataSources: Repository[]
        org: Organization
      }

    // First start by creating the project on the Boost service...
    // TODO: Get the returned value here
    await createProjectOnBoost(
      name,
      org.login,
      primaryDataSource,
      secondaryDataSources,
      auth.user.email,
    )

    console.debug(
      `***** REST POST /temp/projects - finished invoking createProjectOnBoost at ${new Date()}`,
    )

    // Then create the project on the Sara service...
    const project = await createProjectOnSara(
      name,
      primaryDataSource,
      secondaryDataSources,
    )

    console.log(
      `***** REST POST /temp/projects - finished invoking createProjectOnSara - project: ${JSON.stringify(
        project,
      )}`,
    )
    console.debug(
      `***** REST POST /temp/projects - finished invoking createProjectOnSara at ${new Date()}`,
    )

    //   const tickledFileInfos = await postFileInfoToGetFileInfo(name, primaryDataSource, auth.user)

    //   console.debug(
    //     `***** REST POST /temp/projects - tickledFileInfos ${JSON.stringify(tickledFileInfos)}`,
    // )

    // Prepare for OpenAI Assistant creation by gathering file information. Note
    // this call needs to happen after we create the project on the Boost backend
    // in order to get file IDs back.
    //
    // Getting file IDs back isn't an indication that the files have been fully
    // processed yet.
    const fileInfos = await getFileInfoWithRetry(name, org.login, auth.user)

    console.debug(
      `***** REST POST /temp/projects - fileInfos ${JSON.stringify(fileInfos)}`,
    )

    console.debug(
      `***** REST POST /temp/projects - finished invoking getFileInfoForProject at ${new Date()}`,
    )

    if (!fileInfos || fileInfos.length === 0) {
      return new Response('Failed to get file info during project creation', {
        status: 500,
      })
    }

    // Configure the OpenAI Assistant...
    const assistant = await configAssistantForProject(
      project,
      fileInfos,
      auth.user,
      org,
    )

    console.debug(
      `***** REST POST /temp/projects - finished invoking configAssistantForProject at ${new Date()}`,
    )

    console.debug(`***** REST POST /temp/projects - returning at ${new Date()}`)

    const resBody = {
      project,
      assistant,
    }

    return new Response(JSON.stringify(resBody), {
      status: 201,
    })
  } catch (error) {
    console.error(
      `Failed creating project for '${auth.user.username}' because: ${error}`,
    )

    return new Response('Failed to create project', {
      status: 500,
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
