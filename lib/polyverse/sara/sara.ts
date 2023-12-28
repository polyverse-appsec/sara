import { configAssistant } from '../openai/assistants'
import { OPENAI_RUN_STATUS_COMPLETED } from '../openai/constants'
import { appendUserMessage, getAssistantMessages } from '../openai/messages'
import { getThreadRunStatus, runAssistantOnThread } from '../openai/runs'
import { configThread } from '../openai/threads'

import { DEMO_REPO } from '@/lib/polyverse/config'

/**
 * Callback for those interested into the response that Sara returned.
 * 
 * @typedef {function(string)} FullSaraResponseCallback
 */

/**
 * Asks Sara a question for processing. Optionally a callback can be provided
 * that when Saras response is ready will be provided.
 * 
 * A list of messages to ask Sara is expected as a parameter but presently only
 * the first entry in the list will be used to ask Sara a question.
 * 
 * Sara will stream her response as she generates. A 'ReadableStream' will be
 * returned which can be consumed or passed along to something like a 'Response'
 * object instance.
 * 
 * @param question List of questions to ask Sara. Only the
 * @param {FullSaraResponseCallback} [fullSaraResponseCallback] Optional
 * callback with Saras full response.
 * 
 * @returns {ReadableStream} A 'ReadableStream' object that can be used for
 * streaming Sara's response in realtime.
 */
export const querySara = async (question: any, fullSaraResponseCallback?: any) => {
    const assistant = await configAssistant(DEMO_REPO)
    console.log(`Configured an assistant with an ID of '${assistant.id}' - metadata: ${JSON.stringify(assistant.metadata)}`)

    // Configure a thread based off of what would be the first message associated with it
    const thread = await configThread(question[0].content)
    console.log(`Configured a thread with an ID of '${thread.id}' - first message content: ${question[0].content}`)

    // Blindly append a user message to the thread. It is 'blind' in the sense
    // that the same user message could already exist in the thread.
    const threadMessage = await appendUserMessage(thread, question)
    console.log(`Updated message with an ID of '${threadMessage?.id}' - message content: ${JSON.stringify(threadMessage?.content)}`)

    const { id: runID } = await runAssistantOnThread(assistant.id, thread.id)

    return new ReadableStream({
        start(controller) {
            // Periodically monitor the status of the run until it moves into the
            // 'completed' state at which point we need to cancel the interval.
            const intervalID = setInterval(async () => {
                const status = await getThreadRunStatus(runID, thread.id)

                // Once the run is completed check for the final message in the thread
                // that the run was performed on. It ought to be the message from the
                // assistant.
                if (status === OPENAI_RUN_STATUS_COMPLETED) {
                    // Be sure to close out our interval that we have running periodically.
                    // Close it out first in the event that retrieving the list of messages
                    // fails.
                    clearInterval(intervalID)

                    const assistantMessages = await getAssistantMessages(thread.id)
                    console.log(`Concatenated assistant messages: ${assistantMessages}`)

                    // Enqueue a new line first since we have been creating a progress bar
                    // of dots while waiting for our answer
                    controller.enqueue('\n')
                    controller.enqueue(assistantMessages)
                    
                    controller.close()

                    // Call bck for anyone that is interested in the message that was retrieved
                    if (fullSaraResponseCallback) {
                        fullSaraResponseCallback(assistantMessages)
                    }

                    return
                }

                // Show a little progress bar of dots if messages aren't yet ready
                controller.enqueue('.')
            }, 500)
        }
    })
}