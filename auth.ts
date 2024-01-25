import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { Organization } from '@/lib/dataModelTypes'
import exp from 'constants'

console.log(`***** auth.ts evaluation process.env.AUTH_REDIRECT_PROXY_URL 6: ${process.env.AUTH_REDIRECT_PROXY_URL}`)


// TODO: Look at the NextAuth implementation and how they have
// signIn(provider, options, authorizationParams) {
//   return signIn(provider, options, authorizationParams, config)
// },
// signOut(options) {
//   return signOut(options, config)
// },
// update(data) {
//   return update(data, config)
// },

// const httpHandler = (req: NextRequest) => Auth(reqWithEnvUrl(req), config)


// TODO: See these options for the auth config that we can pass when initializing
//   useSecureCookies?: boolean
// debug
//   cookies?: Partial<CookiesOptions>
// trustHost (seems scary)
//   redirectProxyUrl?: string


export const {
  handlers: { GET, POST },
  auth
} = NextAuth({
  debug: true,
  cookies: {
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        httpOnly: false, 
      }
    }
  },
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
      console.log(`***** redirect call back process.env.AUTH_REDIRECT_PROXY_URL 8.30: ${process.env.AUTH_REDIRECT_PROXY_URL}`)
      console.log(`***** redirect call back process.env.APP_ENV : ${process.env.APP_ENV}`)

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
