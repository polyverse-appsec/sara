import OpenAI from 'openai'
import { Run } from 'openai/resources/beta/threads/runs/runs'

const oaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Runs the OpenAI assistant on a thread.
 *
 * @param {string} assistantID ID of the OpenAI assistant to run on a thread.
 * @param {string} threadID ID of the thread to run the OpenAI assistant on.
 * @returns {Run} Object representing the run of the OpenAI assistant on the thread.
 */
export const runAssistantOnThread = (assistantID: string, threadID: string) => {
  return oaiClient.beta.threads.runs.create(threadID, {
    assistant_id: assistantID
  })
}

/**
 * Returns the status of a thread that the OpenAI assistant has been ran on.
 *
 * @param {string} runID ID of the existing run.
 * @param {string} threadID ID of the thread that is having a run performed on it.
 * @returns {string} Current status of the run on the thread.
 */
export const getThreadRunStatus = async (runID: string, threadID: string) => {
  const runStatus = await oaiClient.beta.threads.runs.retrieve(threadID, runID)

  return runStatus
}
