import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { kv } from '@vercel/kv'

import { type UserPartDeux } from './lib/data-model-types'
import { createBaseSaraObject } from './lib/polyverse/db/utils'
import createUser from './lib/polyverse/db/create-user'
import getUser, { createUserNotFoundErrorString } from './lib/polyverse/db/get-user'
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
    signIn({ profile }) {
      // TODO: We need more stringent testing of this logic. We are assuming that
      // our GitHub provider will also have truthy values for these which is a bad
      // assumption we want to make
      if (!profile || !profile.email || !profile.login) {
        console.log(`Refusing sign-in as either the 'profile', or 'profile.email', or 'profile.login' isn't valid`)
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
    async jwt({ token, profile, account, trigger }) {
        if (trigger === 'signIn') {
          if (!profile) {
            throw new Error(`ERROR (shouldn't get here): 'profile' doesn't exist from provider`)
          }

          // We shouldn't get here in theory as we check for the these properties
          // in the `signIn` callback and fail if they aren't present. Lets log
          // scary messages here and return so we don't mess with the DB if for some
          // reason we do get here.
          if (!profile.email) {
            throw new Error(`ERROR (shouldn't get here): 'profile' doesn't have 'email' property from provider`)
          }

          if (!profile.login) {
            throw new Error(`ERROR (shouldn't get here): 'profile' doesn't have 'login' property from provider`)
          }

          if (!account) {
            throw new Error(`ERROR (shouldn't get here): 'account' doesn't exist from provider`)
          }

          if (!account.access_token) {
            throw new Error(`ERROR (shouldn't get here): 'account' doesn't have 'access_token' property from provider`)
          }

          // TODO: Move this logic to the signUp trigger
          try {
            // Start by looking for a user in our DB...
            const retrievedUser = await getUser(profile.email)
            console.debug(`Found existing user for ${profile.email} on sign in`)

            // If we do have one then update the last signed in at date
            retrievedUser.lastSignedInAt = new Date()
            await updateUser(retrievedUser)

            token = {
              ...token,
              ...retrievedUser,
              accessToken: account.access_token
            }

            return token
          } catch (error) {
            if (error instanceof Error && error.message.includes(createUserNotFoundErrorString(profile.email))) {
              console.debug(`Caught user not found error for ${profile.email} on sign in - attempting to create now`)
              const baseSaraObject = createBaseSaraObject()

              const newUser: UserPartDeux = {
                // BaseSaraObject properties
                ...baseSaraObject,

                // User properties
                email: profile.email,
                orgIds: [],
                username: profile.login as string,
                lastSignedInAt: baseSaraObject.createdAt,
              }

              await createUser(newUser)

              token = {
                ...token,
                ...newUser,
                accessToken: account.access_token
              }

              return token
            }
        }
      }

      // TODO: Should I fail here?
      return token
    },
    session: ({ session, token }) => {
      if (session?.user && token?.id) {
        session.user.id = String(token.id)
      }

      if (token?.accessToken && typeof token.accessToken === 'string') {
        session.accessToken = token.accessToken
      }

      session = {
        ...session,
        ...token
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
    signIn: async ({ profile }) => {
      if (!profile) {
        console.error(`ERROR (shouldn't get here): 'profile' doesn't exist from provider`)
        return
      }

      // We shouldn't get here in theory as we check for the these properties
      // in the `signIn` callback and fail if they aren't present. Lets log
      // scary messages here and return so we don't mess with the DB if for some
      // reason we do get here.
      if (!profile.email) {
        console.error(`ERROR (shouldn't get here): 'profile' doesn't have 'email' property from provider`)
        return
      }

      if (!profile.login) {
        console.error(`ERROR (shouldn't get here): 'profile' doesn't have 'login' property from provider`)
        return
      }

      try {
        // Start by looking for a user in our DB...
        const retrievedUser = await getUser(profile.email)
        console.debug(`Found existing user for ${profile.email} on sign in`)

        // If we do have one then update the last signed in at date
        retrievedUser.lastSignedInAt = new Date()
        await updateUser(retrievedUser)
      } catch (error) {
        if (error instanceof Error && error.message.includes(createUserNotFoundErrorString(profile.email))) {
          console.debug(`Caught user not found error for ${profile.email} on sign in - attempting to create now`)
          const baseSaraObject = createBaseSaraObject()

          const newUser: UserPartDeux = {
            // BaseSaraObject properties
            ...baseSaraObject,

            // User properties
            email: profile.email,
            orgIds: [],
            username: profile.login as string,
            lastSignedInAt: baseSaraObject.createdAt,
          }

          await createUser(newUser)

          return
        }

        // If we didn't find the specific user doesn't exist error then re-throw
        throw error
      }
    }
  },
  pages: {
    signIn: '/sign-in' // overrides the next-auth default signin page https://authjs.dev/guides/basics/pages
  }
})
