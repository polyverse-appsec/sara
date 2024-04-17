import { Octokit } from '@octokit/rest'
import { auth } from 'auth'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import getUser from 'lib/polyverse/db/get-user'
import { NextAuthRequest } from 'next-auth/lib'

import logger, { type SaraLogContext } from 'lib/logger'
import {
  type Org,
  type Project,
  type ProjectHealth,
  type User,
} from './../../../lib/data-model-types'

const ghFeedbackAccessToken = process.env.GH_FEEDBACK_ACCESS_TOKEN

interface ActiveProjectDetails {
  id: string
  project: Project
  health: ProjectHealth
}

export interface CreateFeedbackRequestBody {
  feedbackTitle: string
  feedbackDescription: string
  path: string
  activeBillingOrg?: Org
  activeProjectDetails?: ActiveProjectDetails
}

// Note that this API doesn't live under the `api/integrations/github` folder
// as we are consuming the GitHub API for our purposes vs. allowing our users
// to post issues to a repo of their choosing.
export const POST = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.accessToken || !auth.user || !auth.user.email) {
    return new Response(ReasonPhrases.UNAUTHORIZED, {
      status: StatusCodes.UNAUTHORIZED,
    })
  }

  let user: User | null = null
  let feedbackTitle = ''
  let feedbackDescription = ''

  try {
    user = await getUser(auth.user.email)

    // Validate that at least we have a title and description
    const reqBody = (await req.json()) as CreateFeedbackRequestBody

    feedbackTitle = reqBody.feedbackTitle ? reqBody.feedbackTitle.trim() : ''
    feedbackDescription = reqBody.feedbackDescription
      ? reqBody.feedbackDescription.trim()
      : ''

    // If the user didn't provide a title or description just return saying
    // and log a message to capture bad actors
    if (feedbackTitle.length === 0 && feedbackDescription.length === 0) {
      logger.infoWithContext('User provided feedback without any content', {
        user,
      })

      return new Response(ReasonPhrases.CREATED, {
        status: StatusCodes.CREATED,
      })
    }

    let body = `User ID: ${user.id}\n`
    body += `User Name: ${user.username}\n`
    body += `User Email: ${user.email}\n`
    body += `Path: ${reqBody.path}\n`
    body += `Environment: ${process.env.SARA_STAGE}\n`
    body += `${
      feedbackDescription && feedbackDescription.length > 0
        ? 'Feedback: ' + feedbackDescription
        : 'No description provided (check title)'
    }`

    body += '\nActive Billing Org:\n\n'
    body += reqBody.activeBillingOrg
      ? '```\n' + JSON.stringify(reqBody.activeBillingOrg, null, 2) + '\n```'
      : 'Unknown\n'

    body += '\nActive Project Details:\n\n'
    body += reqBody.activeProjectDetails
      ? '```\n' +
        JSON.stringify(reqBody.activeProjectDetails, null, 2) +
        '\n```'
      : 'Unknown\n'

    const octokit = new Octokit({ auth: ghFeedbackAccessToken })

    await octokit.request(`POST /repos/polyverse-appsec/sara/issues`, {
      owner: 'polyverse-appsec',
      repo: 'sara',
      title:
        feedbackTitle && feedbackTitle.length > 0
          ? feedbackTitle
          : 'No title provided (check for details)',
      body,
      assignees: ['Giners', 'StephenAFisher', 'Dewey3K', 'alexgo'],
      labels: ['customer-filed'],
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    return new Response(ReasonPhrases.CREATED, {
      status: StatusCodes.CREATED,
    })
  } catch (error) {
    logger.errorWithContext(
      `Failed to leave user feedback${
        feedbackTitle && feedbackTitle.length > 0 ? ' ' + feedbackTitle : ''
      }${
        feedbackDescription && feedbackDescription.length > 0
          ? ' ' + feedbackDescription
          : ''
      }`,
      { user, error } as SaraLogContext,
    )

    return new Response(ReasonPhrases.INTERNAL_SERVER_ERROR, {
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
