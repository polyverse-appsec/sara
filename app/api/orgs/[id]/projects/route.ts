import {
	ReasonPhrases,
	StatusCodes,
} from 'http-status-codes'
import {
  type GitHubRepo,
  type ProjectDataSourcePartDeux,
  type ProjectPartDeux,
  type Repository,
} from './../../../../../lib/data-model-types'
import { createBaseSaraObject } from './../../../../../lib/polyverse/db/utils'
import { NextAuthRequest } from 'next-auth/lib'

import {
  ASSISTANT_METADATA_CREATOR,
  type AssistantMetadata,
  createAssistant,
  getVersion,
} from './../../../../../lib/polyverse/openai/assistants'

import { auth } from '../../../../../auth'
import { createProject as createProjectOnBoost, getFileInfoPartDeux } from './../../../../../lib/polyverse/backend/backend'
import createProject from './../../../../../lib/polyverse/db/create-project'
import createProjectDataSource from './../../../../../lib/polyverse/db/create-project-data-source'
import getOrg from './../../../../../lib/polyverse/db/get-org'
import getProject from './../../../../../lib/polyverse/db/get-project'
import getUser from './../../../../../lib/polyverse/db/get-user'
import updateOrg from './../../../../../lib/polyverse/db/update-org'

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
    // AuthZ: Check that the user has access to the org
    const user = await getUser(auth.user.email)

    if (!user.orgIds || user.orgIds.length === 0) {
      return new Response(ReasonPhrases.NOT_FOUND, {
        status: StatusCodes.NOT_FOUND,
      })
    }

    // TODO: Should be able to do Dynamic Route segments as documented:
    // https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
    // Problem is our Auth wrapper doesn't like it. See if we can figure
    // out a way to move to this pattern.
    const reqUrl = new URL(req.url)
    const reqUrlSlices = reqUrl.toString().split('/')

    // The 3rd to the last slice ought to be the slug for the repo name
    const requestedOrgId = reqUrlSlices[reqUrlSlices.length - 2]
    const foundOrgId = user.orgIds.find((orgId) => orgId === requestedOrgId)

    if (!foundOrgId) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // AuthZ: Check the user is associated with the requested org
    const org = await getOrg(requestedOrgId)

    if (!org.userIds || org.userIds.length === 0) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    const foundUserId = org.userIds.find((userId) => userId === user.id)

    if (!foundUserId) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // Validate that the name of the project doesn't already exist as
    // another project within the organization
    const reqBody = (await req.json()) as {
      name: string
      description: string
      projectDataSources: GitHubRepo[]
    }

    // TODO: Add more rigourous validation of the data that we receive

    const projectPromises = org.projectIds.map((projectId) =>
      getProject(projectId),
    )
    const projects = await Promise.all(projectPromises)

    const duplicateProject = projects.find((project) => project.name === reqBody.name)

    if (duplicateProject) {
      return new Response(`Project with a name of '${reqBody.name}' already exists`, {
        status: StatusCodes.BAD_REQUEST,
      })
    }

    // TODO: Remnove these temporary instances of the old Repository data
    // model object once we fully transfer over to the new UI and data model
    const oldTypedProjectDataSources = reqBody.projectDataSources.map((projectDataSource) => ({
      // These are data members that are actually consumed by
      // `createProject`
      orgId: org.name,
      // TODO: Simply take the first primary data source for now since we don't have the support for multiple
      html_url: projectDataSource.htmlUrl,

      // These aren't data members that are used by `createProject` so
      // just bullshit the values for now since this will be removed
      id: 'someId',
      userId: 'someUserId',
      name: 'someName',
      full_name: 'someFullName',
      description: 'someDescription',
      organization: {
        login: 'someLoginName',
        avatar_url: 'someAvatarUrl',
      },
    } as Repository))

    // TODO: Since we still rely on the old data model for the usage of this API
    // just pass the first project data source as the primary one and all the
    // others as secondary ones. Once we switch over to the new UI and data
    // model we will need to fix this.
    const secondaryDataSources = oldTypedProjectDataSources.length > 1 ? oldTypedProjectDataSources.slice(1) : []
    await createProjectOnBoost(reqBody.name, org.name, oldTypedProjectDataSources[0], secondaryDataSources, user.email)

    // Start by building up the objects we will create in the DB.
    // Make sure to cross-reference the Project and the Project Data Source
    // IDs that we will be persisting to the DB.
    const projectBaseSaraObject = createBaseSaraObject()
    const projectDataSourceBaseSaraObjects = reqBody.projectDataSources.map(() => createBaseSaraObject())

    const projectDataSourceIds = projectDataSourceBaseSaraObjects.map((projectDataSourceBaseSaraObject) => projectDataSourceBaseSaraObject.id)

    const project: ProjectPartDeux = {
      // BaseSaraObject properties
      ...projectBaseSaraObject,

      // Project properties
      orgId: org.id,
      userIds: [user.id],
      name: reqBody.name,
      description: reqBody.description,
      projectDataSourceIds,
      goalIds: [],
      closedAt: null,
      // The last time we refreshed this project is technically when we created
      // it
      lastRefreshedAt: projectBaseSaraObject.createdAt
    }

    const projectDataSources = reqBody.projectDataSources.map((projectDataSource, projectDataSourceIndex) => ({
      // BaseSaraObject properties
      ...projectDataSourceBaseSaraObjects[projectDataSourceIndex],

      // Project Data Source properties
      parentProjectId: projectBaseSaraObject.id,
      sourceUrl: projectDataSource.htmlUrl,
    } as ProjectDataSourcePartDeux))

    // Write the new objects to the DB. Start with the child objects first.
    const createProjectDataSourcePromises = projectDataSources.map((projectDataSource) => createProjectDataSource(projectDataSource))
    await Promise.all(createProjectDataSourcePromises)
    await createProject(project)

    // Update other objects with references to these newly created objects...
    org.projectIds = [...org.projectIds, project.id]
    await updateOrg(org)

    // Prepare to build the OpenAI Assistant for the project by getting the file
    // info from the Boost backend for the project we just created
    // TODO: We really ought to be passing in the `ID` of the `project` instance
    // but need to build more support out for using generic IDs in the backend
    const fileInfos = await getFileInfoPartDeux(org.name, project.name, user.email)

    // Build up OpenAI Assistant metadata that will be used to help identify it
    // in the future
    const assistantMetadata: AssistantMetadata = {
      projectId: project.id,
      userName: user.username,
      orgName: org.name,
      creator: ASSISTANT_METADATA_CREATOR,
      version: getVersion()
    }

    await createAssistant(fileInfos, assistantMetadata)

    // TODO: Cache files

    // Finally cache the file info we associated with the OpenAI Assistant so
    // that in the future we can update it if need be.

    // Return the project we created to the user...
    return new Response(JSON.stringify(project), {
      status: StatusCodes.CREATED,
    })
  } catch (error) {
    console.error(
      `Failed creating project for '${auth.user.username}' because: ${error}`,
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
    // AuthZ: Check that the user has access to the org
    const user = await getUser(auth.user.email)

    if (!user.orgIds || user.orgIds.length === 0) {
      return new Response(ReasonPhrases.NOT_FOUND, {
        status: StatusCodes.NOT_FOUND,
      })
    }

    // TODO: Should be able to do Dynamic Route segments as documented:
    // https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
    // Problem is our Auth wrapper doesn't like it. See if we can figure
    // out a way to move to this pattern.
    const reqUrl = new URL(req.url)
    const reqUrlSlices = reqUrl.toString().split('/')

    // The 2nd to the last slice ought to be the slug for the repo name
    const requestedOrgId = reqUrlSlices[reqUrlSlices.length - 2]
    const foundOrgId = user.orgIds.find((orgId) => orgId === requestedOrgId)

    if (!foundOrgId) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // AuthZ: Check the user is associated with the requested org
    const org = await getOrg(requestedOrgId)

    if (!org.userIds || org.userIds.length === 0) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    const foundUserId = org.userIds.find((userId) => userId === user.id)

    if (!foundUserId) {
      return new Response(ReasonPhrases.FORBIDDEN, {
        status: StatusCodes.FORBIDDEN,
      })
    }

    // Gather the projects for the user
    const projectPromises = org.projectIds.map((projectId) =>
      getProject(projectId),
    )
    const projects = await Promise.all(projectPromises)

    return new Response(JSON.stringify(projects), {
      status: StatusCodes.OK,
    })
  } catch (error) {
    console.error(
      `Failed fetching projects for org for '${auth.user.username}' because: ${error}`,
    )

    return new Response('Failed to fetch projects', {
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
