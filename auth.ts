import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { Organization } from '@/lib/polyverse/data-model/dataModelTypes'
import exp from 'constants'

export const {
  handlers: { GET, POST },
  auth
} = NextAuth({
  // TODO: Review - Make sure we fully understand what this is doing? Maybe only set if provided in an environment variable
  trustHost: true,
  providers: [
    GitHub({
      authorization: {
        params: { scope: 'user:email, read:org, read:user, repo' }
      }
    })
  ],
  callbacks: {
    jwt({ token, profile, account }) {
      if (profile) {
        token.id = profile.id
        token.username = profile.login // Save the GitHub username
        token.image = profile.avatar_url || profile.picture
        token.email = profile.email
      }
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    session: ({ session, token }) => {
      if (session?.user && token?.id) {
        session.user.id = String(token.id)
        session.user.username = (token as any).username as string // Type assertion
      }
      if (token?.accessToken && typeof token.accessToken === 'string') {
        session.accessToken = token.accessToken
      }
      return session
    },
    authorized({ auth }) {
      return !!auth?.user // this ensures there is a logged in user for -every- request
    }
  },
  pages: {
    signIn: '/sign-in' // overrides the next-auth default signin page https://authjs.dev/guides/basics/pages
  }
})
