import { auth } from './../../../auth'
import { NextAuthRequest } from 'next-auth/lib'
import getUserOrgs from './../../../lib/polyverse/db/get-user-orgs'
import createOrg from './../../../lib/polyverse/db/create-org'
import { OrgPartDeux } from './../../../lib/data-model-types'
import { createBaseSaraObject } from './../../../lib/polyverse/db/utils'
import updateUser from './../../../lib/polyverse/db/update-user'
import getUser from './../../../lib/polyverse/db/get-user'

export const POST = auth(async (req: NextAuthRequest) => {
    const { auth } = req

    if (!auth || !auth.accessToken || !auth.user.email || !auth.user.id) {
        return new Response('Unauthorized', {
            status: 401
        })
    }

    try {
        const user = await getUser(auth.user.email)

        // Validate that the user hasn't already created a billing organization
        // with the same name. For now we expect the names of the billing
        // organiziations to be those of GitHub organizations but our data model
        // isn't built around the idea of GitHub organizations. It just serves
        // as a convenient starting point for the name of a billing
        // organization.
        const { name } = await req.json()

        const existingOrgs = await getUserOrgs(user.email)
        const duplicateOrg = existingOrgs.find((existingOrg) => existingOrg.name === name)

        if (duplicateOrg) {
            return new Response(`Billing organization with a name of '${name}' already exists`, {
                status: 400
            })
        }

        // Create the object in our DB...
        const baseSaraObject = createBaseSaraObject()

        const org: OrgPartDeux = {
            // BaseSaraObject properties
            ...baseSaraObject,

            // Org properties
            userIds: [user.id],
            name,
            projectIds: []
        }

        await createOrg(org)

        // Update our user with the org ID...
        user.orgIds = [...user.orgIds, org.id]
        user.lastUpdatedAt = new Date()
        await updateUser(user)

        // Return the object we created to the user...
        return new Response(JSON.stringify(org), {
            status: 201
        })
    } catch (error) {
        console.error(`Failed creating org for '${auth.user.username}' because: ${error}`)

        return new Response('Failed to fetch organizations', {
            status: 500
        })
    }
}) as any

export const GET = auth(async (req: NextAuthRequest) => {
    const { auth } = req

    if (!auth || !auth.accessToken || !auth.user.email) {
        return new Response('Unauthorized', {
            status: 401
        })
    }

    try {
        const orgs = await getUserOrgs(auth.user.email)

        return new Response(JSON.stringify(orgs), {
            status: 200
        })
    } catch (error) {
        console.error(`Failed fetching orgs for '${auth.user.username}' because: ${error}`)

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
