import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { NextAuthRequest } from 'next-auth/lib'
import Joi from 'joi'

import { auth } from '../../../../../auth'
import {
  type GitHubRepo,
  type ProjectDataSourcePartDeux,
  type ProjectPartDeux,
  type Repository,
} from './../../../../../lib/data-model-types'
import {
  createProject as createProjectOnBoost,
  getBoostOrgUserStatus
} from './../../../../../lib/polyverse/backend/backend'
import createProject from './../../../../../lib/polyverse/db/create-project'
import createProjectDataSource from './../../../../../lib/polyverse/db/create-project-data-source'
import getOrg from './../../../../../lib/polyverse/db/get-org'
import getProject from './../../../../../lib/polyverse/db/get-project'
import getUser from './../../../../../lib/polyverse/db/get-user'
import updateOrg from './../../../../../lib/polyverse/db/update-org'
import { createBaseSaraObject } from './../../../../../lib/polyverse/db/utils'

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

    if (
      !reqBody.name ||
      Joi.string().required().validate(reqBody.name).error
    ) {
      return new Response(`Request body is missing 'name'`, {
        status: StatusCodes.BAD_REQUEST,
      })
    }

    // TODO: Add more rigourous validation of the data that we receive

    const projectPromises = org.projectIds.map((projectId) =>
      getProject(projectId),
    )

    const projects = await Promise.all(projectPromises)

    const duplicateProject = projects.find(
      (project) => project.name === reqBody.name,
    )

    if (duplicateProject) {
      return new Response(
        `Project with a name of '${reqBody.name}' already exists`,
        {
          status: StatusCodes.BAD_REQUEST,
        },
      )
    }

    // 03/12/24: For now we are blocking project creation unless you have the
    // GitHub App installed for the org you are trying to create a project under
    // and you are a premium user. In the future we will more intelligently
    // allow projects to be created and thus making this workflow more
    // permissive.
    const boostOrgUserStatus = await getBoostOrgUserStatus(org.name, user.email)

    // If the `username` data member shows up on the user status that means
    // the user has the GitHub App installed.
    const gitHubAppInstalled =
      boostOrgUserStatus.github_username &&
      boostOrgUserStatus.github_username.length > 0

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

    // TODO: Remnove these temporary instances of the old Repository data
    // model object once we fully transfer over to the new UI and data model
    const oldTypedProjectDataSources = reqBody.projectDataSources.map(
      (projectDataSource) =>
        ({
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
        }) as Repository,
    )

    // TODO: Since we still rely on the old data model for the usage of this API
    // just pass the first project data source as the primary one and all the
    // others as secondary ones. Once we switch over to the new UI and data
    // model we will need to fix this.
    const secondaryDataSources =
      oldTypedProjectDataSources.length > 1
        ? oldTypedProjectDataSources.slice(1)
        : []

    await createProjectOnBoost(
      reqBody.name,
      org.name,
      oldTypedProjectDataSources[0],
      secondaryDataSources,
      user.email,
    )

    // Start by building up the objects we will create in the DB.
    // Make sure to cross-reference the Project and the Project Data Source
    // IDs that we will be persisting to the DB.
    const projectBaseSaraObject = createBaseSaraObject()
    const projectDataSourceBaseSaraObjects = reqBody.projectDataSources.map(
      () => createBaseSaraObject(),
    )

    const projectDataSourceIds = projectDataSourceBaseSaraObjects.map(
      (projectDataSourceBaseSaraObject) => projectDataSourceBaseSaraObject.id,
    )

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
      lastRefreshedAt: projectBaseSaraObject.createdAt,
    }

    const projectDataSources = reqBody.projectDataSources.map(
      (projectDataSource, projectDataSourceIndex) =>
        ({
          // BaseSaraObject properties
          ...projectDataSourceBaseSaraObjects[projectDataSourceIndex],

          // Project Data Source properties
          parentProjectId: projectBaseSaraObject.id,
          sourceUrl: projectDataSource.htmlUrl,
        }) as ProjectDataSourcePartDeux,
    )

    // Write the new objects to the DB. Start with the child objects first.
    const createProjectDataSourcePromises = projectDataSources.map(
      (projectDataSource) => createProjectDataSource(projectDataSource),
    )

    await Promise.all(createProjectDataSourcePromises)
    await createProject(project)

    // Update other objects with references to these newly created objects...
    org.projectIds = [...org.projectIds, project.id]
    await updateOrg(org)

    // It may seem weird that we don't go on to create the OpenAI Assistant
    // here or cache the file info used when building the OpenAI Assistant
    // prompt but we defer this logic to the handler for:
    // `POST /api/projects/projectId/config`.
    //
    // This is done for UX/UI synchronization pruposes wherein the UI can
    // start polling for the projects health at:
    // `GET /api/projects/projectId/health`.
    //
    // This allows the UI to provide a more responsive - and restrictive if
    // need be - experience. For example we can prevent chatting if the project
    // is in an `UNHEALTHY` state if it doesn't have the most up-to-date files.
    //
    // This solution/API may not be suitable for a headless agent model so in
    // the future we may need to revisit this logic/approach to project
    // creation.

    // Return the project we created to the user...
    return new Response(JSON.stringify(project), {
      status: StatusCodes.CREATED,
    })
  } catch (error) {
    console.error(
      `Failed creating project for '${auth.user.name}' because: ${error}`,
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
