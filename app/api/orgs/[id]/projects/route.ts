import {
  type GitHubRepo,
  type GoalPartDeux,
  type ProjectDataSource,
  type ProjectPartDeux,
  type Repository,
} from 'lib/data-model-types'
import { createBaseSaraObject } from 'lib/polyverse/db/utils'
import { NextAuthRequest } from 'next-auth/lib'

import { auth } from '../../../../../auth'
import { createProject } from './../../../../../lib/polyverse/backend/backend'
import createGoal from './../../../../../lib/polyverse/db/create-goal'
import createProjectDb from './../../../../../lib/polyverse/db/create-project'
import createProjectDataSource from './../../../../../lib/polyverse/db/create-project-data-source'
import getOrg from './../../../../../lib/polyverse/db/get-org'
import getProject from './../../../../../lib/polyverse/db/get-project'
import getUser from './../../../../../lib/polyverse/db/get-user'
import updateOrg from './../../../../../lib/polyverse/db/update-org'

export const POST = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.accessToken || !auth.user.email || !auth.user.id) {
    return new Response('Unauthorized', {
      status: 401,
    })
  }

  try {
    // AuthZ: Check that the user has access to the org
    const user = await getUser(auth.user.email)

    if (!user.orgIds || user.orgIds.length === 0) {
      return new Response('Not Found', {
        status: 404,
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
      return new Response('Forbidden', {
        status: 403,
      })
    }

    // AuthZ: Check the user is associated with the requested org
    const org = await getOrg(requestedOrgId)

    if (!org.userIds || org.userIds.length === 0) {
      return new Response('Forbidden', {
        status: 403,
      })
    }

    const foundUserId = org.userIds.find((userId) => userId === user.id)

    if (!foundUserId) {
      return new Response('Forbidden', {
        status: 403,
      })
    }

    // Validate that the name of the project doesn't already exist as
    // another project within the organization
    const { name, description, primaryDataSource } = (await req.json()) as {
      name: string
      description: string
      primaryDataSource: GitHubRepo[]
    }

    // TODO: Add validation of the data that we receive

    const projectPromises = org.projectIds.map((projectId) =>
      getProject(projectId),
    )
    const projects = await Promise.all(projectPromises)

    const duplicateProject = projects.find((project) => project.name === name)

    if (duplicateProject) {
      return new Response(`Project with a name of '${name}' already exists`, {
        status: 400,
      })
    }
    // TODO: Remnove this temporary instance of the old Repository data
    // model object we use
    const oldTypedPrimaryDataSource: Repository = {
      // These are data members that are actually consumed by
      // `createProject`
      orgId: org.name,
      // TODO: Simply take the first primary data source for now since we don't have the support for multiple
      html_url: primaryDataSource[0].htmlUrl,

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
    }

    await createProject(name, oldTypedPrimaryDataSource, [], user.email)

    // Start by building up the objects we will create in the DB.
    // Make sure to cross-reference the Project and the Project Data Source
    // IDs that we will be persisting to the DB.
    const projectBaseSaraObject = createBaseSaraObject()
    const projectDataSourceBaseSaraObject = createBaseSaraObject()
    const goalBaseSaraObject = createBaseSaraObject()

    const project: ProjectPartDeux = {
      // BaseSaraObject properties
      ...projectBaseSaraObject,

      // Project properties
      orgId: org.id,
      userIds: [user.id],
      name,
      description,
      primaryDataSourceId: projectDataSourceBaseSaraObject.id,
      secondaryDataSourceIds: [],
      goalIds: [goalBaseSaraObject.id],
      closedAt: null,
    }

    // TODO: Create projectDataSources for eact project we get in the request
    const projectDataSource: ProjectDataSource = {
      // BaseSaraObject properties
      ...projectDataSourceBaseSaraObject,

      // Project Data Source properties
      parentProjectId: projectBaseSaraObject.id,
      sourceUrl: primaryDataSource[0].htmlUrl,
    }

    // Build up a default project goal to be added to our project when we
    // create it
    const goal: GoalPartDeux = {
      // BaseSaraObject properties
      ...goalBaseSaraObject,

      // Goal properties
      orgId: org.id,
      name: 'Learn More About Your Project',
      description:
        'Sara provides details about your project as she learns them',
      // TODO: Set the chat ID to the empty string for now as we don't
      // have a way to create chats after atomically in this workflow. We
      // should submit this chat after created in our KV store.
      chatId: '',
      parentProjectId: projectBaseSaraObject.id,
      taskIds: [],
    }

    // Write the new objects to the DB. Start with the child objects first.
    await createProjectDataSource(projectDataSource)
    await createGoal(goal)
    await createProjectDb(project)

    // Update other objects with references to these newly created objects...
    org.projectIds = [...org.projectIds, project.id]
    org.lastUpdatedAt = new Date()
    await updateOrg(org)

    // Return the project we created to the user...
    return new Response(JSON.stringify(project), {
      status: 201,
    })
  } catch (error) {
    // TODO: Update down here
    console.error(
      `Failed creating org for '${auth.user.username}' because: ${error}`,
    )

    return new Response('Failed to fetch organizations', {
      status: 500,
    })
  }
}) as any

export const GET = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.accessToken || !auth.user.email) {
    return new Response('Unauthorized', {
      status: 401,
    })
  }

  try {
    // AuthZ: Check that the user has access to the org
    const user = await getUser(auth.user.email)

    if (!user.orgIds || user.orgIds.length === 0) {
      return new Response('Not Found', {
        status: 404,
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
      return new Response('Forbidden', {
        status: 403,
      })
    }

    // AuthZ: Check the user is associated with the requested org
    const org = await getOrg(requestedOrgId)

    if (!org.userIds || org.userIds.length === 0) {
      return new Response('Forbidden', {
        status: 403,
      })
    }

    const foundUserId = org.userIds.find((userId) => userId === user.id)

    if (!foundUserId) {
      return new Response('Forbidden', {
        status: 403,
      })
    }

    // Gather the projects for the user
    const projectPromises = org.projectIds.map((projectId) =>
      getProject(projectId),
    )
    const projects = await Promise.all(projectPromises)

    return new Response(JSON.stringify(projects), {
      status: 200,
    })
  } catch (error) {
    console.error(
      `Failed fetching projects for org for '${auth.user.username}' because: ${error}`,
    )

    return new Response('Failed to fetch projects', {
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