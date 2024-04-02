import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

import { type User } from './lib/data-model-types'
import { createBaseSaraObject } from './lib/polyverse/db/utils'
import createUser from './lib/polyverse/db/create-user'
import getUser, { createUserNotFoundErrorString } from './lib/polyverse/db/get-user'
import updateUser from 'lib/polyverse/db/update-user'
import { Session } from 'next-auth/types'
import { updateBoostOrgUserStatus } from 'lib/polyverse/backend/backend'

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
      // This callback is called whenever a JSON Web Token is created (i.e. at
      // sign in) or updated (i.e whenever a session is accessed in the client).
      // The returned value will be encrypted, and it is stored in a cookie.
      //
      // The first time this callback is invoked the value of `trigger` ought to
      // equal `signIn`. At this time the params `user`, `profile`, and
      // `account` ought to be present. In subsequent calls only `token` will be
      // available.
      //
      // The GitHub auth provider ought to set these values on the `profile`:
      // `id`, `name`, `email`, `image`. Additionally you ought to have `login`
      // which will correspond to the GitHub user name (i.e. `Giners`).
      //
      // An OAuth2/OpenID token ought to be available on `account.access_token`
      //
      // We are able to add any data we wish in this token and later make it
      // available in the browser.
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

        try {
          // Start by looking for a user in our DB...
          const retrievedUser = await getUser(profile.email)
          console.debug(`Found existing user for ${profile.email} on sign in`)

          // If we do have one then update the last signed in at date
          retrievedUser.lastSignedInAt = new Date()
          await updateUser(retrievedUser)

          // Update the backend user info - email, login time, OAuth token, etc.
          try {
            // we don't need an org to update the username, since login is tied to email, but we'll pass an org (or email as org)
            //      for now, since the backend requires it for all user APIs
            const orgName = retrievedUser.orgIds.length > 0 ? retrievedUser.orgIds[0] : profile.email
            await updateBoostOrgUserStatus(orgName, profile.email, profile.login as string)
          } catch (error) {
            console.error(`Failed to update Boost org user status for ${profile.email} to ${profile.login} on sign in:`, error)
          }

          token = {
            // Don't forget to copy over any of the other original token props
            ...token,
            ...retrievedUser,
            accessToken: account.access_token
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes(createUserNotFoundErrorString(profile.email))) {
            console.debug(`Caught user not found error for ${profile.email} on sign in - attempting to create now`)
            const baseSaraObject = createBaseSaraObject()

            const newUser: User = {
              // BaseSaraObject properties
              ...baseSaraObject,

              // User properties
              email: profile.email,
              orgIds: [],
              username: profile.login as string,
              lastSignedInAt: baseSaraObject.createdAt,
            }

            await createUser(newUser)

            // Update the backend user info - email, login time, OAuth token, etc.
            try {
                const orgName = profile.email // placeholder since we don't know the org yet, and login is tied to email only
                await updateBoostOrgUserStatus(orgName, profile.email, profile.login as string)
            } catch (error) {
                console.error(`Failed to update Boost org user status for ${profile.email} to ${profile.login} on sign in:`, error)
            }

            token = {
                // Don't forget to copy over any of the other original token props
              ...token,
              ...newUser,
              accessToken: account.access_token
            }
          }
        }
      }

      return token
    },
    session: ({ session, token }) => {
      // The `session` callback is called whenver a session is checked. For
      // security purposes anything we added to the token in the `jwt` callback
      // we need to forward it to the session here.

      // We use this logic to preserve some of the old functionality in the old
      // UI. We are currently (03/11/24) trying to cut over to the new UI so
      // we might be able to remove this logic later and just rely on
      // `session.id` which we spread onto the session below.
      if (session.user  && token.id) {
        session.user.id = String(token.id)
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
  pages: {
    signIn: '/sign-in' // overrides the next-auth default signin page https://authjs.dev/guides/basics/pages
  }
})

// These properties correlate to what is spread out from the GitHub auth
// provider from the `jwt` callback when we spread out `profile`. Additionally
// details about the user as we preserve in our DB are stored here. Most
// importantly of those details is `id`.
export interface SaraSession extends Session {
  id: string
  name: string
  username: string
  email: string
  picture: string
}
