import NextAuth, { type DefaultSession } from 'next-auth'
import GitHub from 'next-auth/providers/github'

declare module 'next-auth' {
  interface Session {
    user: {
      /** The user's GitHub username. */
      username: string
      id: string
      image?: string
      email?: string
    } & DefaultSession['user']
    accessToken: string
  }
}

export const {
  handlers: { GET, POST },
  auth
} = NextAuth({
  providers: [
    GitHub({
      authorization: { params: { scope: 'user:email, read:org, read:user' } }
    })
  ],
  callbacks: {
    jwt({ token, profile, account }) {
      console.log(`In jwt callback - token: ${JSON.stringify(token)}`)
      console.log(`In jwt callback - profile: ${JSON.stringify(profile)}`)
      console.log(`In jwt callback - account: ${JSON.stringify(account)}`)

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
      console.log(`In session callback - session: ${JSON.stringify(session)}`)
      console.log(`In session callback - token: ${JSON.stringify(token)}`)

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
