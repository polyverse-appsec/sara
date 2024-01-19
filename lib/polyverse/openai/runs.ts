import OpenAI from 'openai'
import { Run } from 'openai/resources/beta/threads/runs/runs'

import { submitTaskSteps } from './assistantTools'

const oaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    assistant_id: assistantID,
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

type ToolOutput = {
  tool_call_id: string
  output: string
}

/**
 * Helper method to build the tool output objects that are used in the response
 * to an OpenAI thread having a `status` of `requires_action` and
 * `required_action.type` of `submit_tool_outputs`.
 *
 * @param {string} toolCallID ID of the tool that is being called
 * @param {string} [output] Output of the tool call. Defaults to the empty
 * string if not provided.
 * @returns {ToolOutput} Tool output object that can be included in the
 * response.
 */
const buildToolOutput = (
  toolCallID: string,
  output: string = '',
): ToolOutput => ({
  tool_call_id: toolCallID,
  output,
})

/**
 * Thread runs handle for whose `status` moves to `requires_action`. Will invoke
 * the relevant functions for the OpenAI Assistant working on the thread and
 * provide back the relevant output.
 *
 * @param {string} userID ID of the user whom asked a question of Sara that
 * triggered her to require further action from our backend.
 * @param {string} repoID ID of the repo the user set as the active repo when
 * asking a question of Sara when she asked for additional action from our
 * backend.
 * @param {string} threadID ID of thread OpenAI Assistant is working on
 * @param {string} runID ID of the run on the thread
 * @param {Run} runStatus Details of the run status and what actions need to be
 * taken.
 */
export const handleRequiresActionStatus = async (
  userID: string,
  repoID: string,
  threadID: string,
  runID: string,
  runStatus: Run,
) => {
  // Identify any tool calls to us
  if (
    runStatus.required_action?.type === 'submit_tool_outputs' &&
    runStatus.required_action?.submit_tool_outputs.tool_calls
  ) {
    const toolCalls = runStatus.required_action?.submit_tool_outputs.tool_calls

    // All tool outputs need to be submitted in a single request per OpenAI
    // docs. Track all tool outputs here for later submission as invoking all of
    // our tools provided to the OpenAI Assistant.
    const toolOutputs = []

    for (const toolCall of toolCalls) {
      const { name: toolName, arguments: toolArgs } = toolCall.function

      if (toolName === 'submitTaskSteps') {
        const parsedArgsAsTasks = JSON.parse(toolArgs)

        await submitTaskSteps(userID, repoID, parsedArgsAsTasks)

        // While we don't generate any output from `submitTaskSteps` we still
        // need to response back to OpenAI with a tool output response object
        toolOutputs.push(buildToolOutput(toolCall.id))
      }
    }

    // After going through all of our tool calls submit a single response with
    // their outputs. Submitting a single response is required per the OpenAI
    // docs.
    await oaiClient.beta.threads.runs.submitToolOutputs(
      threadID,
      runID,
      // While `tool_outputs` is required to have an array value it
      // can be empty per the OpenAI API docs if nothing further is
      // required.
      {
        tool_outputs: toolOutputs,
      },
    )
  }
}
