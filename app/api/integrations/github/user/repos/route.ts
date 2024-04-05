import { Octokit } from '@octokit/rest'
import { auth } from 'auth'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { NextAuthRequest } from 'next-auth/lib'

export const GET = auth(async (req: NextAuthRequest) => {
  const { auth } = req

  if (!auth || !auth.accessToken) {
    return new Response(ReasonPhrases.UNAUTHORIZED, {
      status: StatusCodes.UNAUTHORIZED,
    })
  }

  try {
    // TODO: Should be able to do Dynamic Route segments as documented:
    // https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
    // Problem is our Auth wrapper doesn't like it. See if we can figure
    // out a way to move to this pattern.
    const octokit = new Octokit({ auth: auth.accessToken })

    // GitHub docs on how to paginate: https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api?apiVersion=2022-11-28
    const repos = await octokit.paginate(
      octokit.rest.repos.listForAuthenticatedUser,
      {
        type: 'owner', // This ensures you get only the repos where the user is the owner
        per_page: 100, // Adjust the number of repos per page as needed
        headers: { 'X-GitHub-Api-Version': '2022-11-28' },
      },
    )

    // Map the data members returned by GitHub to a format more consistent
    // to what we use in our code (snake_case -> camelCase)
    const mappedRepos = repos.map((repo) => ({
      name: repo.name,
      htmlUrl: repo.html_url,
      // Used when selecting data sources for a project
      private: repo.private,
    }))

    return new Response(JSON.stringify(mappedRepos), {
      status: StatusCodes.OK,
    })
  } catch (error) {
    console.error(
      `Failed fetching GitHub repos for '${auth.user.username}' because: ${error}`,
    )

    return new Response('Failed to fetch repos', {
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
