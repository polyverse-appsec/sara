import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { Organization } from '@/lib/dataModelTypes'
import exp from 'constants'

console.log(`***** auth.ts evaluation process.env.AUTH_REDIRECT_PROXY_URL 4:04: ${process.env.AUTH_REDIRECT_PROXY_URL}`)

export const {
  handlers: { GET, POST },
  auth
} = NextAuth({
  // redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
  providers: [
    GitHub({
      authorization: {
        params: { scope: 'user:email, read:org, read:user, repo' }
      }
    })
  ],
  callbacks: {
    redirect({url, baseUrl}) {
      console.log(`***** redirect call back url: ${url}`)
      console.log(`***** redirect call back baseUrl: ${baseUrl}`)
      console.log(`***** redirect call back process.env.NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`)
      console.log(`***** redirect call back process.env.AUTH_REDIRECT_PROXY_URL 4:04: ${process.env.AUTH_REDIRECT_PROXY_URL}`)

      return url
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
  // pages: {
  //   signIn: '/sign-in' // overrides the next-auth default signin page https://authjs.dev/guides/basics/pages
  // }
})
