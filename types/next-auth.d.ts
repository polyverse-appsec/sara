import NextAuth, { DefaultSession } from 'next-auth'

import { Organization, Repository, Task } from '@/lib/dataModelTypes'

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
    activeOrganization?: Organization
    activeRepository?: Repository
    activeTask?: Task
    referenceRepositories?: {
      organization: Organization
      repository: string
    }[]
  }
}
