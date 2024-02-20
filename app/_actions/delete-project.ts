'use server'

import { auth } from './../../auth'

import { deleteProject as deleteProjectBackend } from './../../lib/polyverse/backend/backend'

import { type User } from './../../lib/data-model-types'


export const deleteProject = async (orgId: string, user: User, projectName: string) => {
    const session = await auth()

    if (!session?.user?.id || user?.id !== session.user.id || !user.email) {
        throw new Error('Unauthorized')
    }

    await deleteProjectBackend(orgId, projectName, user.email)
}