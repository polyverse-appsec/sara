import { Octokit } from '@octokit/rest'

import { auth } from './../../../auth'
import { NextAuthRequest } from 'next-auth/lib'


// TODO: If this works then just export a GET without auth on it in our lib for a sara rest service
export const GET = auth(async (req: NextAuthRequest) => {
    const { auth } = req

    if (!auth || !auth.accessToken || !auth.user.username) {
        return new Response('Unauthorized', {
            status: 401
        })
    }

    const octokit = new Octokit({auth: auth.accessToken })
    
    try {
        const response = await octokit.request('GET /user/orgs', {
            headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            },
        })

        // TODO: Gross. Remap these data members to align with our data model
        const orgs = response.data.map((org) => ({
            login: org.login,
            avatar_url: org.avatar_url,
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
