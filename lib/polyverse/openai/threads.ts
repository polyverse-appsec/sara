import OpenAI from 'openai'

import { Threads } from 'openai/resources/beta/threads/threads'

// TODO: Does this need to be prettieried? Are we following the same tabbing/spacing?


// TODO: Is this a singleton? Ramifications if it isnt?
const oaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

/**
 * Simple global map of created threads and their IDs keyed off of a hash of
 * the first indexed message that would be associated with said thread. 
 */
const threadIDsByMessageContentHashMap: Record<string, string> = {}

/**
 * Simple hash function to shorten a long string
 * 
 * @param stringToHash String to hash
 * @returns Hash of string
 */
function hashString(stringToHash: string) {
    // TODO: This is cryptographically insecure - for demo purposes
    let hash = 0
  
    for (let i = 0; i < stringToHash.length; i++) {
      const char = stringToHash.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
  
    return hash
  }

/**
 * Attempts to retrieve a thread ID based on the contents of a message via a
 * simple hashing algorithm. If the thread ID doesn't yet exist then
 * 'undefined' is returned.
 * 
 * @param {string} messageContent The content of a message that would be associated
 * with a thread
 * @returns {(string|undefined)} Thread ID if thread exists otherwise 'undefined'
 */
function getThreadIDFromMessageContent(messageContent: string): string | undefined {
    const messageContentHash = hashString(messageContent)
    return threadIDsByMessageContentHashMap[messageContentHash]
}

/**
 * Given the content of a message from a thread it maps the ID of the thread
 * with the content based on a simple hashing algorithm.
 * 
 * @param {string} messageContent The content of a message associated with the thread
 * @param {string} threadID The ID of the thread 
 */
function mapThreadID(messageContent: string, threadID: string) {
    const messageContentHash = hashString(messageContent)
    threadIDsByMessageContentHashMap[messageContentHash] = threadID
}

// An OpenAI Thread is the logical representation of a back and forth
// conversation with an OpenAI Assistant. Threads get messages associated with
// them at which point the OpenAI Assistant can be triggered to generate a
// response from the latest message in the thread.

/**
 * Configures an OpenAI thread for use. Configuration is done based on the
 * initial message that would be associated with a thread (i.e the first indexed
 * message). If the thread doesn't yet exist it will create it first.
 * 
 * @param {string} messageContent The initial message that would be associated with a thread.
 * @returns {Promise<Thread>} Promise with the configured OpenAI thread
 */
export async function configThread(messageContent: string): Promise<Threads.Thread> {
    // TODO: Note this function deviates from the original one 'findOrCreateThread'
    // in that is just takes the first indexed message for the content
    const threadID = getThreadIDFromMessageContent(messageContent)

    if (threadID) {
        return oaiClient.beta.threads.retrieve(threadID)
    }

    const thread = await oaiClient.beta.threads.create()
    mapThreadID(messageContent, thread.id)

    return thread
}