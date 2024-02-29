import { NextAuthRequest } from 'next-auth/lib'

import {
    type Organization,
    type Repository
  } from './../../../../lib/data-model-types'

import { auth } from './../../../../auth'
// import { createProjectOnBoost } from './../../../../app/_actions/create-project-on-boost'
import { createProject as createProjectOnBoost } from './../../../../lib/polyverse/backend/backend'
import { createProjectOnSara } from './../../../../app/_actions/create-project-on-sara'
import { getFileInfoForProject } from './../../../../app/_actions/get-file-info-for-repo'
import { configAssistantForProject } from './../../../../app/_actions/config-assistant-for-project'

export const POST = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.accessToken || !auth.user.email || !auth.user.id) {
    return new Response('Unauthorized', {
      status: 401,
    })
  }

  try {
    const { name, primaryDataSource, secondaryDataSources, org } = (await req.json()) as {
        name: string
        primaryDataSource: Repository
        secondaryDataSources: Repository[]
        org: Organization
    }

    // First start by creating the project on the Boost service...
    // TODO: Get the returned value here
    await createProjectOnBoost(
        name,
        primaryDataSource,
        secondaryDataSources,
        auth.user.email
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

    console.debug(
        `***** REST POST /temp/projects - finished invoking createProjectOnSara at ${new Date()}`,
    )

    // Prepare for OpenAI Assistant creation by gathering file information. Note
    // this call needs to happen after we create the project on the Boost backend
    // in order to get file IDs back.
    //
    // Getting file IDs back isn't an indication that the files have been fully
    // processed yet.
    const fileInfos = await getFileInfoForProject(
        name,
        primaryDataSource,
        auth.user,
    )

    console.debug(
        `***** REST POST /temp/projects - finished invoking getFileInfoForProject at ${new Date()}`,
    )

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

    console.debug(
        `***** REST POST /temp/projects - returning at ${new Date()}`,
    )

    const resBody = {
        project,
        assistant
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