'use server'

import { getUser } from './get-user'
import { createUser } from './create-user'

import { type User } from './../../lib/data-model-types'

export async function getOrCreateUserFromSession(session: any): Promise<User> {
    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }
  
    const user = await getUser(session.user.id)
  
    if (user) {
      return user
    }
  
    return await createUser(session.user)
}