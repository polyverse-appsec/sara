import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { kv } from '@vercel/kv'

import { type UserPartDeux } from './lib/data-model-types'
import { createBaseSaraObject } from './lib/polyverse/db/utils'
import createUser from './lib/polyverse/db/create-user'
import getUser from './lib/polyverse/db/get-user'
import updateUser from 'lib/polyverse/db/update-user'

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
    signIn({ user, account, profile }) {
      console.log(`***** auth - user: ${JSON.stringify(user)}`)
      console.log(`***** auth - account: ${JSON.stringify(account)}`)
      console.log(`***** auth - profile: ${JSON.stringify(profile)}`)

      // TODO: We need more stringent testing of this logic. We are assuming that
      // our GitHub provider will also have truthy values for these which is a bad
      // assumption we want to make
      if (!profile || !profile.email || !profile.name) {
        console.log(`Refusing sign-in as either the 'profile', or 'profile.email', or 'profile.name' isn't valid`)
        return false
      }

      return true
    },
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
  // More info regarding events: https://authjs.dev/guides/basics/events
  //
  // Note that the execution of our authentication API will be blocked on awaits
  // in our event handlers. If it starts burdensome work it should not block its
  // own promise on that work.
  events: {
    signIn: async ({ user }) => {
      // We shouldn't get here in theory as we check for the these properties
      // in the `signIn` callback and fail if they aren't present. Lets log
      // scary messages here and return so we don't mess with the DB if for some
      // reason we do get here.
      if (!user.email) {
        console.error(`ERROR (shouldn't get here): 'user' doesn't have 'email' property from provider`)
        return
      }

      if (!user.name) {
        console.error(`ERROR (shouldn't get here): 'user' doesn't have 'name' property from provider`)
        return
      }

      // Start by looking for a user in our DB...
      const retrievedUser = await getUser(user.email)

      // If we don't have one create it...
      if (!retrievedUser) {
        const { email, name: username } = user
        const baseSaraObject = createBaseSaraObject()

        const newUser: UserPartDeux = {
          // BaseSaraObject properties
          ...baseSaraObject,

          // User properties
          email,
          orgIds: [],
          username,
          lastSignedInAt: baseSaraObject.createdAt,
        }

        await createUser(newUser)

        return
      }

      // If we do have one then update the last signed in at date
      retrievedUser.lastSignedInAt = new Date()
      await updateUser(retrievedUser)
    }
  },
  pages: {
    signIn: '/sign-in' // overrides the next-auth default signin page https://authjs.dev/guides/basics/pages
  }
})
