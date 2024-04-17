import OpenAI from 'openai'
import { Assistant } from 'openai/resources/beta/assistants/assistants'
import { Run } from 'openai/resources/beta/threads/runs/runs'
import { Thread } from 'openai/resources/beta/threads/threads'

import { type PromptFileInfo, type Task } from './../../../lib/data-model-types'
import createTask from './../../../lib/polyverse/db/create-task'
import getGoal from './../../../lib/polyverse/db/get-goal'
import updateGoal from './../../../lib/polyverse/db/update-goal'
import { createBaseSaraObject } from './../../../lib/polyverse/db/utils'
import { aispecId, projectsourceId, blueprintId } from './utils'

const oaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type WorkItemsForGoalType = {
  title: string
  description: string
  acceptanceCriteria: string
}

export type SubmitWorkItemsForGoalType = {
  workItems: WorkItemsForGoalType[]
}

export const submitTaskStepsAssistantFunction: Assistant.Function = {
  type: 'function',
  function: {
    name: 'submitWorkItemsForGoal',
    description:
      'If an answer has identified individual work items that will be required to complete the project goal, this function will let you record the work items in our database.',
    parameters: {
      type: 'object',
      properties: {
        workItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'The title of the work item',
              },
              description: {
                type: 'string',
                description:
                  'The description of the work item to be done in markdown format',
              },
              acceptanceCriteria: {
                type: 'string',
                description:
                  'Well defined acceptance criteria in a markdown bullet list format used to determine when the work item is complete',
              },
            },
          },
        },
      },
      required: ['workItems'],
    },
  },
}

export const submitWorkItemsForGoal = async (
  goalId: string,
  orgId: string,
  parsedArgsAsWorkItems: SubmitWorkItemsForGoalType,
) => {
  if (parsedArgsAsWorkItems) {
    const tasksToCreate: Task[] = []

    parsedArgsAsWorkItems.workItems.forEach((workItem) => {
      const taskBaseSaraObject = createBaseSaraObject()
      const task: Task = {
        // BaseSaraObject properties
        ...taskBaseSaraObject,

        // Task properties
        orgId,
        name: workItem.title,
        description: workItem.description,
        acceptanceCriteria: workItem.acceptanceCriteria,
        status: 'OPEN',
        chatId: null,
        parentGoalId: goalId,
        parentTaskId: null,
        subTaskIds: [],
      }

      tasksToCreate.push(task)
    })

    const createTaskPromises = tasksToCreate.map((taskToCreate) =>
      createTask(taskToCreate),
    )

    // I'd prefer to not have to await for all of these task creation promises
    // but my understanding is that Vercel doesn't have background processing.
    // If we don't await here and we respond to the users request before these
    // tasks are written to the data store I fear Vercel may just drop the
    // work required to write them.
    console.debug(
      `Sara generated ${createTaskPromises.length} tasks for goal '${goalId}'`,
    )

    await Promise.all(createTaskPromises)

    // Now be sure to update the goal with the latest task IDs
    const createdTaskIds = tasksToCreate.map((createdTask) => createdTask.id)

    const goal = await getGoal(goalId)
    goal.taskIds.push(...createdTaskIds)

    await updateGoal(goal)
  }
}

export const handleRequiresActionStatusForProjectGoalChatting = async (
  threadRun: Run,
  goalId: string,
  orgId: string,
) => {
  // Identify any tool calls we may use while chatting about a project goal
  if (
    threadRun.required_action?.type === 'submit_tool_outputs' &&
    threadRun.required_action?.submit_tool_outputs.tool_calls
  ) {
    console.debug(
      `Attempting to handle actions for thread run '${threadRun.id}' for goal '${goalId}'`,
    )
    const toolCalls = threadRun.required_action?.submit_tool_outputs.tool_calls

    // All tool outputs need to be submitted in a single request per OpenAI
    // docs. Track all tool outputs here for later submission as invoking all of
    // our tools provided to the OpenAI Assistant.
    const toolOutputs = []

    for (const toolCall of toolCalls) {
      const { name: toolName, arguments: toolArgs } = toolCall.function

      if (toolName === 'submitWorkItemsForGoal') {
        console.debug(
          `Invoking 'submitWorkItemsForGoal' as a required action chatting about goal '${goalId}'`,
        )
        const parsedArgsAsWorkItems = JSON.parse(toolArgs)

        await submitWorkItemsForGoal(goalId, orgId, parsedArgsAsWorkItems)

        toolOutputs.push({
          tool_call_id: toolCall.id,
          // For now we don't provide any output back to the assistant when
          // generating tasks
          output: '',
        })
      } else {
        console.error(
          `Unrecognized tool invoked named '${toolName}' for goal '${goalId}' on OpenAI Thread Run '${threadRun.id}'`,
        )

        throw new Error(
          `Unrecognized tool invoked named '${toolName}' for goal`,
        )
      }
    }

    // After going through all of our tool calls submit a single response with
    // their outputs. Submitting a single response is required per the OpenAI
    // docs.
    await oaiClient.beta.threads.runs.submitToolOutputs(
      threadRun.thread_id,
      threadRun.id,
      // While `tool_outputs` is required to have an array value it
      // can be empty per the OpenAI API docs if nothing further is
      // required.
      {
        tool_outputs: toolOutputs,
      },
    )
  }
}

export const createOpenAIAssistantPromptForGoals = (
  goalName: string,
  goalDescription?: string,
  goalAcceptanceCriteria?: string,
): string => `
      You will be asked a question in the context of trying to accomplish the high-level project goal named ${goalName}.
      ${
        goalDescription
          ? 'The description of the goal is as follows: ' + goalDescription
          : ''
      }
      ${
        goalAcceptanceCriteria
          ? 'The acceptance criteria that needs to be satisfied to accomplish the goal is as follows: ' +
            goalAcceptanceCriteria
          : ''
      }

      The answers you provide to asked questions ought to focus on trying to:
      1. Provide knowledge around understanding the Project goal named ${goalName}
      2. Remove any ambiguity around understanding the project goal named ${goalName}
      3. Identify individual work items that will be required to complete the project goal name ${goalName}
      4. For each Task identified, please note the list of relative paths to Project source file paths from ${projectsourceId}

      Important: When asked a question that identifies invidiual work items required to complete the project goal named ${goalName} you should record the 
      individual work items in our database using the submitWorkItemsForGoal function provided to you. Each individual work item needs the following details:
      1. Title
      2. Description
      3. Well defined acceptance criteria in a bullet list format (this will be used to determine when the work item is complete)

      You do not need to ask for permission or if the work items should be written to the database. Please always write the work items to the database.

      You can then continue to response to the question as you normally would by provide both the answer as well as the individual work items you recorded 
      that are required to complete the project goal named ${goalName}.`

export const createThreadForProjectGoalChatting = async (
  projectId: string,
  goalId: string,
  chatId: string,
  chatQueryId: string,
  query: string,
): Promise<Thread> => {
  const threadMetadata = {
    projectId,
    goalId,
    chatId,
  }

  const messageMetadata = {
    chatQueryId,
  }

  return oaiClient.beta.threads.create({
    messages: [
      {
        role: 'user',
        content: query,
        metadata: messageMetadata,
      },
    ],
    metadata: threadMetadata,
  })
}

export const createThreadRunForProjectGoalChatting = async (
  goalName: string,
  goalDescription: string | undefined,
  assistantId: string,
  threadId: string,
): Promise<Run> => {
  const prompt = createOpenAIAssistantPromptForGoals(goalName, goalDescription)

  return oaiClient.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    // Don't override the global Assistant instructions - just append to them
    // the specifics of how Sara ought to answer this question
    additional_instructions: prompt,
    // Override the OpenAI Assistant tools for this thread run to allow for the
    // creation of tasks (called work items in the prompt)
    tools: [
      { type: 'code_interpreter' },
      { type: 'retrieval' },
      submitTaskStepsAssistantFunction,
    ],
  })
}

export const addQueryToThreadForProjectGoalChatting = async (
  threadId: string,
  chatQueryId: string,
  query: string,
) => {
  const messageMetadata = {
    chatQueryId,
  }

  await oaiClient.beta.threads.messages.create(threadId, {
    role: 'user',
    content: query,
    metadata: messageMetadata,
  })
}

export const getChatQueryResponseFromThread = async (
  threadId: string,
  chatQueryId: string,
): Promise<string> => {
  const { data: messages } =
    await oaiClient.beta.threads.messages.list(threadId)

  // Find the index of the user query to OpenAI that we are tracking in our
  // datastore as a chat query
  const chatQueryIndex = messages.findIndex((message, index) => {
    const metadata = message.metadata as { chatQueryId: string }

    if (
      metadata.chatQueryId &&
      metadata.chatQueryId === chatQueryId &&
      message.role === 'user'
    ) {
      return true
    }

    return false
  })

  // If we didn't find it throw an error. Typically we check for -1 indicating
  // the index wasn't found but we also want to ensure that the corresponding
  // user query isn't the first one in the messages array. This would denote
  // that there aren't any assistant responses either.
  if (chatQueryIndex < 1) {
    throw new Error(
      `Unable to locate user chat query with an ID of '${chatQueryId}'`,
    )
  }

  // Presuming that the messages returned by OpenAI are listed with the most
  // recent message as the first index in the array returned take a slice of the
  // responses up to our user query.
  const assistantMessages = messages.slice(0, chatQueryIndex)
  const chatQueryResponse = (
    await assistantMessages.reduce(
      async (concatenatedMessagePromise, assistantMessage) => {
        let concatenatedMessage = await concatenatedMessagePromise

        const { content: contents } = assistantMessage

        // Use `for` loop as `Array#forEach` doesn't support async/await
        for (
          let contentIndex = 0;
          contentIndex < contents.length;
          contentIndex++
        ) {
          const content = contents[contentIndex]

          if (content.type !== 'text') {
            throw new Error(
              `Tried to process unrecognized content type '${content.type}' for chat query with an ID of '${chatQueryId}'`,
            )
          }

          const textContent = content.text

          // Handle citations to files the assistant included in the message
          const annotations = textContent.annotations
          const citations: string[] = []

          // Use `for` loop as `Array#forEach` doesn't support async/await
          for (
            let annotationIndex = 0;
            annotationIndex < annotations.length;
            annotationIndex++
          ) {
            const annotation = annotations[annotationIndex]

            // Replace the text with a footnote
            textContent.value = textContent.value.replace(
              annotation.text,
              ` [${annotationIndex}]`,
            )

            if (
              annotation.type !== 'file_citation' &&
              annotation.type !== 'file_path'
            ) {
              throw new Error(
                `Tried to process unrecognized annotation type for chat query with an ID of '${chatQueryId}'`,
              )
            }

            // Handle citations within a message that points to a specific quote
            // from a specific file associated with the assistant or message. This
            // citation is generated when the assistant uses the 'retrieval' tool to
            // search files.
            if (annotation.type === 'file_citation') {
              const citedFile = await oaiClient.files.retrieve(
                annotation.file_citation.file_id,
              )

              citations.push(`[${annotationIndex}] ${citedFile.filename}`)
            }

            // Handle citation within a message that generated a URL for the file
            // the assistant used the 'code_interpreter' tool to generate a file.
            if (annotation.type === 'file_path') {
              const citedFile = await oaiClient.files.retrieve(
                annotation.file_path.file_id,
              )

              citations.push(
                `[${annotationIndex}] Click <here> to download ${citedFile.filename}`,
              )
            }

            // Note: Actual file download link or mechanism to trigger downloads not implemented
          }

          textContent.value += '\n\n' + citations.join('\n')

          concatenatedMessage += textContent.value
          concatenatedMessage += '\n'
        }

        return concatenatedMessage
      },
      Promise.resolve(''),
    )
  ).trim()

  // Protect against the edge case where it appears our thread run is complete
  // but ChatGPT doesn't actually show we have a response. It isn't clear how
  // we can get in this state but it has been observed once and the result is
  // bad. We won't properly render chats (they will appear blank) and we will
  // stop querying for updated future chats.
  if (chatQueryResponse.length === 0) {
    throw new Error(
      `Chat query with an ID of '${chatQueryId}' is empty`,
    )
  }

  return chatQueryResponse
}

export const getThreadRunForProjectGoalChatting = async (
  threadId: string,
  threadRunId: string,
): Promise<Run> => {
  return oaiClient.beta.threads.runs.retrieve(threadId, threadRunId)
}
