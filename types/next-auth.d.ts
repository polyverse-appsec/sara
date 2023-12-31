import NextAuth, { DefaultSession } from 'next-auth'

import { Organization, Repository } from '@/lib/types'

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      username: string
      id: string
      image?: string
      email?: string
    } & DefaultSession['user']
    accessToken: string
    organization?: Organization
    repository?: Repository
    referenceRepositories?: {
      organization: Organization
      repository: string
    }[]
  }
}
