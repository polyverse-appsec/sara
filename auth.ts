import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { Organization } from '@/lib/dataModelTypes'
import exp from 'constants'

export const {
  handlers: { GET, POST },
  auth
} = NextAuth({
  providers: [
    GitHub({
      authorization: {
        params: { scope: 'user:email, read:org, read:user, repo' }
      }
    })
  ],
  callbacks: {
    redirect({url, baseUrl}) {
      // Return the env var `NEXTAUTH_URL` which ought to be set to a unique
      // value for each deployment environment if set
      if (process.env.NEXTAUTH_URL) {
        return process.env.NEXTAUTH_URL
      }

      // Otherwise return the `baseUrl`. During testing we found that this URL
      // matches that of the host we are truly interested in being redirected
      // back to where as `url` often (all the time?) had an incorrect value. It
      // isn't known as to why this is yet but possibly researching the headers
      // of requests made to our backend might shed some light. We see that the
      // `next-auth.callback-url` header isn't the correct value and possibly
      // that conincides with why `url` has an incorrect value. 
      return baseUrl
    },
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
