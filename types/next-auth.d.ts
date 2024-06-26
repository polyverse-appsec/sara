import NextAuth, { DefaultSession } from 'next-auth'

import { Organization, Project, Task } from '@/lib/dataModelTypes'

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: User
    accessToken: string
  }
}
