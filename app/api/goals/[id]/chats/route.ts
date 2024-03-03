import { auth } from '../../../../../auth'

import { NextAuthRequest } from 'next-auth/lib'

export const POST = auth(async (req: NextAuthRequest) => {
    const { auth } = req
  
    if (!auth || !auth.accessToken || !auth.user.email || !auth.user.id) {
      return new Response('Unauthorized', {
        status: 401,
      })
    }
  
    try {
        // TODO: Other endpoints needed to support async chat
        // GET /api/chats/<id> - get details on the chat
        // GET /api/chats/<id>/refresh - refresh the assistant files and assistant prompt with the files
        // GET /api/chats/<id>/queries - all the messages associated with a chat
        // DELETE /api/chats/<id> - delete the chat at the ID

        // TODO: Genereal ideas/steps to work through
        // 1) AuthZ
        // 2) Validate URI slugs
        //      make sure goal actually exists
        // 3) Validate request body
        //      Make sure chat for goal doesn't already exist
        // 4) Build out query details in KV
        //    Chat ID it is associated with
        //    Pointer to previos query (in this case its empty since first query)
        //    Pointer to neext query (in this case its empty since first query)
        //    Timestamp when query received
        //    Add query content
        //    Empty response content
        //    Timestamp when response received (empty in this case since it hasn't been received)
        // 5) Build out chat details in KV
        //    Chat points to goal
        //    Chat has pointer for first query
        //    Chat has pointer to last query (same as first in this response)
        // 6) Update global IDs
        //     Of what?
        // 7) Respond to user with the details of the chat ID
        // Async 8) Refresh assistant files from Boost
        // Async 9) Update assistant prompt for asking Goal oriented question
        // Aysnc 10) Build out OpenAI thread
        // Async 11) Submit Goal to OpenAI thread by creating a run

  
      // Return the chat details we created to the user...
      return new Response(JSON.stringify(({})), {
        status: 201,
      })
    } catch (error) {
      console.error(
        `Failed creating chat for '${auth.user.username}' because: ${error}`,
      )
  
      return new Response('Failed to create chat', {
        status: 500,
      })
    }
  }) as any


// Note: Looks like based on this commit the NextAuth team are aware that their
// wrapper is causing NextJS build errors:
// https://github.com/nextauthjs/next-auth/commit/6a2f8a1d77c633ae3d0601a30f67523f38df2ecc
//
// Build errors would look something like:
// app/api/orgs/route.ts
// Type error: Route "app/api/orgs/route.ts" has an invalid export:
//   "unknown" is not a valid GET return type:
//     Expected "void | Response | Promise<void | Response>", got "unknown".