import { Chat, Project, Task } from '../../data-model-types'
import { appendUserMessage, getAssistantMessages } from '../openai/messages'
import {
  getThreadRunStatus,
  handleRequiresActionStatus,
  runAssistantOnThread,
  cancelRunOnThread,
} from '../openai/runs'
import { configThread } from '../openai/threads'

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
 * @param {string} userID The ID of the user whom we made a request to Sara on
 * their behalf.
 * @param project
 * @param task
 * @param chat
 * @param question List of questions to ask Sara.
 * @param {FullSaraResponseCallback} [fullSaraResponseCallback] Optional
 * callback with Saras full response. Called when completed or on failure.
 * @returns {ReadableStream} A 'ReadableStream' object that can be used for
 * streaming Sara's response in realtime.
 */
export const querySara = async (
  userID: string,
  project: Project,
  question: any,
  fullSaraResponseCallback?: any,
) => {


  const assistant = project.assistant
  const encoder = new TextEncoder()

  if (!assistant) {
    console.log(`No assistant found for repo: ${project.name}`)
    return
  }
  // Configure a thread based off of what would be the first message associated with it
  const thread = await configThread(question[0].content)

  // Blindly append a user message to the thread. It is 'blind' in the sense
  // that the same user message could already exist in the thread.
  const threadMessage = await appendUserMessage(thread, question)
  const { id: runID } = await runAssistantOnThread(assistant.id, thread.id)

  return new ReadableStream({
    // Cancel the run on the thread when stream is aborted (client hits stops generating response)
    async cancel(reason) {
      await cancelRunOnThread(runID, thread.id)
    },  
    start(controller) {
      // Periodically monitor the status of the run until it moves into the
      // 'completed' state at which point we need to cancel the interval.
      const intervalID = setInterval(async () => {
        const { id: threadID } = thread

        const runStatus = await getThreadRunStatus(runID, threadID)
        const status = runStatus.status

        if (status === 'requires_action') {
          await handleRequiresActionStatus(
            userID,
            project.name,
            thread.id,
            runID,
            runStatus,
          )

          return
        } else if (status === 'completed') {
          // Be sure to close out our interval that we have running periodically.
          // Close it out first in the event that retrieving the list of messages
          // fails.
          clearInterval(intervalID)

          // Once the run is completed check for the final message in the thread
          // that the run was performed on. It ought to be the message from the
          // assistant.
          const assistantMessages = await getAssistantMessages(threadID)
          console.debug(`Concatenated assistant messages from run completion: ${assistantMessages}`)

          // Enqueue a new line first since we have been creating a progress bar
          // of dots while waiting for our answer
          controller.enqueue(encoder.encode('\n'))
          controller.enqueue(encoder.encode(assistantMessages))

          // Call bck for anyone that is interested in the message that was retrieved
          if (fullSaraResponseCallback) {
            await fullSaraResponseCallback(assistantMessages)
          }

          controller.close()

          return
        } else if (status === 'failed') {
          clearInterval(intervalID)

          const threadRunError = JSON.stringify(runStatus.last_error)
          const errorMessage = `Sara failed to generate a response. Reason: ${threadRunError}`

          console.debug(`Thread with ID '${threadID}' had run with ID '${runID}' failed because: ${threadRunError}`)

          controller.enqueue(encoder.encode('\n'))
          controller.enqueue(encoder.encode(errorMessage))

          // If there is a callback make sure to call it even if we failed
          if (fullSaraResponseCallback) {
            await fullSaraResponseCallback(errorMessage)
            console.log('Called fullSaraResponseCallback')
          }

          controller.close()

          return
        } else {
          console.debug(
            `Unhandled thread run status - runID: '${runID}' - status: ${status}`,
          )
        }

        // Show a little progress bar of dots if messages aren't yet ready
        try {
          controller.enqueue(encoder.encode('.'))
        } catch (error) { 
          clearInterval(intervalID)
          console.error(`Error enqueuing a progress bar dot: ${error}`)
        }
      }, 500)
    },
  })
}
