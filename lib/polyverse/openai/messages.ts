import OpenAI from 'openai'

const oaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

  if (role === 'user') {
    return await oaiClient.beta.threads.messages.create(id, {
      role: 'user',
      content,
    })
  }
}

/**
 * Returns a list of messages for a given thread.
 *
 * @param {string} threadID ID of thread to get messages for
 * @returns List of messages associated with a thread
 */
export const listMessages = async (threadID: string) =>
  await oaiClient.beta.threads.messages.list(threadID)

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
  const userIndex = messages.findIndex(({ role }) => role === 'user')

  return messages
    .slice(0, userIndex)
    .reduce((concatenatedMessage, assistantMessage) => {
      assistantMessage.content.forEach((messageContent) => {
        if (messageContent.type === 'text') {
          let messageTextContent = messageContent.text

          // Following logic is to handle file citations the assistant includes in the responses
          let messageAnnotations = messageTextContent.annotations
          let citations: string[] = []

          messageAnnotations.forEach(async (annotation, index) => {
            // Replace the text with a footnote
            messageTextContent.value = messageTextContent.value.replace(
              annotation.text,
              ` [${index}]`,
            )

            // Primary ones our assistants are using are file citations (from the files that we have uploaded to OpenAI)
            if (annotation.type == 'file_citation') {
              const citedFile = await oaiClient.files.retrieve(
                annotation.file_citation.file_id,
              )
              citations.push(
                `[${index}] ${annotation.file_citation.quote} from ${citedFile.filename}`,
              )
            } else if (annotation.type == 'file_path') {
              const citedFile = await oaiClient.files.retrieve(
                annotation.file_path.file_id,
              )
              citations.push(
                `[${index}] Click <here> to download ${citedFile.filename}`,
              )
              // Note: Actual file download link or mechanism to trigger downloads not implemented
            }
          })
          messageTextContent.value += '\n' + citations.join('\n')

          concatenatedMessage += messageTextContent.value
          concatenatedMessage += '\n'
        }
      })

      return concatenatedMessage
    }, '')
    .trim()
}
