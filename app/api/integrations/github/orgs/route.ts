import { Octokit } from '@octokit/rest'

import { auth } from '../../../../../auth'
import { NextAuthRequest } from 'next-auth/lib'

export const GET = auth(async (req: NextAuthRequest) => {
    const { auth } = req

    if (!auth || !auth.accessToken || !auth.user.username) {
        return new Response('Unauthorized', {
            status: 401
        })
    }

    const octokit = new Octokit({auth: auth.accessToken })
    
    try {
        const res = await octokit.request('GET /user/orgs', {
            headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            },
        })

        // Map the data members returned by GitHub to a format more consistent
        // to what we use in our code (snake_case -> camelCase)
        const orgs = res.data.map((org) => ({
            login: org.login,
            avatarUrl: org.avatar_url,
        }))

        return new Response(JSON.stringify(orgs), {
            status: 200
        })
    } catch (error) {
        console.error(`Failed fetching GitHub orgs for '${auth.user.username}' because: ${error}`)

        return new Response('Failed to fetch organizations', {
            status: 500
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
