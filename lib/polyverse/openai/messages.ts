import OpenAI from 'openai'

const OPENAI_MESSAGE_ROLE_USER = 'user'

// TODO: Is this a singleton? Ramifications if it isnt?
const oaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

/**
 * Updates the file IDs for an existing OpenAI assistant.
 * 
 * @param {string[]} fileIDs Array of file IDs to associated with the existing OepnAI assistant.
 * @param {Assistant} assistant Existing OpenAI assistant with the 'id' field filled out
 * @returns Promise<Assistant> asdf 
 */

/**
 * Takes the last message from a list of messages and appends it to a thread if
 * the message in question is that from the 'user' role. If a message is
 * appended then the appended message is returned.
 * 
 * @param {Thread} thread The thread to append the message to 
 * @param messages List of messages where the last message is a 'user' message
 * @returns {(Promise<ThreadMessage>|Promise<undefined>)} Returns the appended
 * message or nothing in a promise
 */
export async function appendUserMessage({ id }: { id: string }, messages: any) {
    // TODO: Why do we just append? If the user message content is the same as the last message we just end up
    // appending another message to the thread with the same content. See original method 'updateMessages'
    // TODO: Review what happens when we just regenerate the content/response from the AI button?

    // If the last message is that of a 'user' message just append another user
    // message to the end of the thread
    const { role, content } = messages[messages.length - 1]

    if (role === OPENAI_MESSAGE_ROLE_USER) {
        return await oaiClient.beta.threads.messages.create(id, { role: OPENAI_MESSAGE_ROLE_USER, content })
    }
}