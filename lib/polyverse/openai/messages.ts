import OpenAI from 'openai'

import { OPENAI_MESSAGE_CONTENT_TYPE_TEXT, OPENAI_MESSAGE_ROLE_USER } from './constants'

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
    // If the last message is that of a 'user' message just append another user
    // message to the end of the thread
    const { role, content } = messages[messages.length - 1]

    if (role === OPENAI_MESSAGE_ROLE_USER) {
        return await oaiClient.beta.threads.messages.create(id, { role: OPENAI_MESSAGE_ROLE_USER, content })
    }
}

/**
 * Returns a list of messages for a given thread.
 * 
 * @param {string} threadID ID of thread to get messages for 
 * @returns List of messages associated with a thread
 */
export const listMessages = async (threadID: string) => await oaiClient.beta.threads.messages.list(threadID)

/**
 * Gathers together all messages from the OpenAI assistant in a thread up to
 * the first 'user' message found.
 * 
 * @param {string} threadID ID of the thread to get 'assistant' messages for
 * @returns {string} String of all 'assistant' messages concatenated together
 */
export const getAssistantMessages = async (threadID: string) => {
    const { data: messages } = await listMessages(threadID)

    // Find the first index of a 'user' role messages
    const userIndex = messages.findIndex(({ role }) => role === OPENAI_MESSAGE_ROLE_USER)

    return messages.slice(0, userIndex).reduce((concatenatedMessage, assistantMessage) => {
        assistantMessage.content.forEach((messageContent) => {
            if (messageContent.type === OPENAI_MESSAGE_CONTENT_TYPE_TEXT) {
                concatenatedMessage += messageContent.text.value
                concatenatedMessage += '\n'
            }
        })

        return concatenatedMessage
    }, '').trim()
}
