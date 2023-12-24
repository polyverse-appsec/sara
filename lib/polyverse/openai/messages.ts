import OpenAI from 'openai'
import { AssistantFilesPage } from 'openai/resources/beta/assistants/files'
import { threadId } from 'worker_threads'

const OPENAI_MESSAGE_ROLE_ASSISTANT = 'assistant'
const OPENAI_MESSAGE_ROLE_USER = 'user'

const OPENAI_MESSAGE_CONTENT_TYPE_TEXT = 'text'

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

/**
 * Returns a list of messages for a given thread.
 * 
 * @param {string} threadID ID of thread to get messages for 
 * @returns List of messages associated with a thread
 */
export const listMessages = async (threadID: string) => await oaiClient.beta.threads.messages.list(threadID)

// TODO: Comments
export const getAssistantMessages = async (threadID: string) => {
    const { data: messages } = await listMessages(threadID)

    // Find the first index of a 'user' role messages
    const userIndex = messages.findIndex(({ role }) => role === OPENAI_MESSAGE_ROLE_USER)

    // TODO: What do we do if it is negative 1 here indicating we didn't find it?
    // TODO: If there is a length then it must have something in it that is all assistant messages
    // if (userIndex === -1) {

    // }

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

function concatenateAssistantMessages(finalMessages: any[]): string {
    console.log(`concatenateAssistantMessages - finalMessages: ${JSON.stringify(finalMessages)}`)
    let concatenatedText = ''
  
    for (const message of finalMessages) {
      if (message.role === 'assistant') {
        message.content.forEach((contentItem: any) => {
          if (contentItem.type === 'text') {
            concatenatedText += contentItem.text.value + '\n'
          }
        })
      } else if (message.role === 'user') {
        break
      }
    }
  
    return concatenatedText.trim()
}