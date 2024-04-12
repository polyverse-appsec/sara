import { Octokit } from '@octokit/rest'
import { auth } from 'auth'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { NextAuthRequest } from 'next-auth/lib'

import { type User } from './../../../lib/data-model-types'
import logger, { type SaraLogContext } from '../logger'
import getUser from 'lib/polyverse/db/get-user'

const ghFeedbackAccessToken = process.env.GH_FEEDBACK_ACCESS_TOKEN

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
    let feedbackTitle = null
    let feedbackContent = null

    try {
        user = await getUser(auth.user.email)

        const octokit = new Octokit({ auth: auth.accessToken })
    
        await octokit.request(`POST /repos/polyverse-appsec/sara/issues`, {
            owner: 'polyverse-appsec',
            repo: 'sara',
            title: 'Test Issues - Sara Created',
            body: 'Test issue contents',
            assignees: ['Giners', 'StephenAFisher', 'Dewey3K'],
            labels: ['customer-filed'],
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })

        return new Response(ReasonPhrases.CREATED, {
            status: StatusCodes.CREATED
        })
    } catch (error) {
        logger.errorWithContext(`Failed to leave user feedback${feedbackTitle ? ' ' + feedbackTitle : ''}${feedbackContent ? ' ' + feedbackContent : ''}`, {user, error} as SaraLogContext)

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