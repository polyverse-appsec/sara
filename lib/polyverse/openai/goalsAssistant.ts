import OpenAI from 'openai'
import { Assistant } from 'openai/resources/beta/assistants/assistants'
import { Run } from 'openai/resources/beta/threads/runs/runs'
import { Thread } from 'openai/resources/beta/threads/threads'

import { TaskPartDeux, type PromptFileInfo } from './../../../lib/data-model-types'
import { findAssistantFromMetadata, type AssistantMetadata } from './assistants'
import { createBaseSaraObject } from './../../../lib/polyverse/db/utils'
import createTask from './../../../lib/polyverse/db/create-task'

const oaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface PromptFileTypes {
  blueprint: string
  aispec: string
  projectsource: string
}

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
    const createTaskPromises: Promise<void>[] = []

    parsedArgsAsWorkItems.workItems.forEach((workItem) => {
      // Build up the description as a combination of the description that Sara
      // generated as well as the acceptance criteria for completing the work
      // item
      const description = workItem.description
        + '\n'
        + 'Acceptance Criteria'
        + '\n'
        + workItem.acceptanceCriteria

      const taskBaseSaraObject = createBaseSaraObject()
      const task: TaskPartDeux = {
        // BaseSaraObject properties
        ...taskBaseSaraObject,

        // Task properties
        orgId,
        name: workItem.title,
        description,
        status: 'OPEN',
        chatId: null,
        parentGoalId: goalId,
        parentTaskId: null,
        subTaskIds: []
      }

      createTaskPromises.push(createTask(task))
    })

    // I'd prefer to not have to await for all of these task creation promises
    // but my understanding is that Vercel doesn't have background processing.
    // If we don't await here and we respond to the users request before these
    // tasks are written to the data store I fear Vercel may just drop the
    // work required to write them.
    console.debug(`Sara generated ${createTaskPromises.length} for goal '${goalId}'`)
    await Promise.all(createTaskPromises)
  }
}

export const handleRequiresActionStatusForProjectGoalChatting = async (
  threadRun: Run,
  goalId: string,
  orgId: string
) => {
  // Identify any tool calls we may use while chatting about a project goal
  if (
    threadRun.required_action?.type === 'submit_tool_outputs' &&
    threadRun.required_action?.submit_tool_outputs.tool_calls
  ) {
    console.debug(`Attempting to handle actions for thread run '${threadRun.id}' for goal '${goalId}'`)
    const toolCalls = threadRun.required_action?.submit_tool_outputs.tool_calls

    // All tool outputs need to be submitted in a single request per OpenAI
    // docs. Track all tool outputs here for later submission as invoking all of
    // our tools provided to the OpenAI Assistant.
    const toolOutputs = []

    for (const toolCall of toolCalls) {
      const { name: toolName, arguments: toolArgs } = toolCall.function

      if (toolName === 'submitWorkItemsForGoal') {
        console.debug(`Invoking 'submitWorkItemsForGoal' as a required action chatting about goal '${goalId}'`)
        const parsedArgsAsWorkItems = JSON.parse(toolArgs)

        await submitWorkItemsForGoal(goalId, orgId, parsedArgsAsWorkItems)

        toolOutputs.push({
          tool_call_id: toolCall.id,
          // For now we don't provide any output back to the assistant when
          // generating tasks
          output: ''
        })
      } else {
        console.error(`Unrecognized tool invoked named '${toolName}' for goal '${goalId}' on OpenAI Thread Run '${threadRun.id}'`)

        throw new Error(`Unrecognized tool invoked named '${toolName}' for goal`)
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

function createOpenAIAssistantPromptForGoals(
  promptFileTypes: PromptFileTypes,
  goalName: string,
  goalDescription: string,
): string {
  return `
      You are a software architecture assistant as well as a coding assistant named Sara. 
      You have access to the full codebase of a project in your files, including a file named ${promptFileTypes.aispec} that summarizes the code.

      When asked a question it will be in the context of trying to accomplish the high-level project goal named ${goalName}.
      The description of the goal named ${goalName} is as follows: ${goalDescription}

      The answers you provide to asked questions ought to focus on trying to:
      1. Provide knowledge around understanding the project goal named ${goalName}
      2. Remove any ambiguity around understanding the project goal named ${goalName}
      3. Identify individual work items that will be required to complete the project goal name ${goalName}

      If someone asks a more specific coding question about the project, unless otherwise explicitly told not to, you give answers that use the relevant frameworks, APIs, data structures, and other aspects of the existing code.

      There are at least three files you have access to that will help you answer questions:
      1. ${promptFileTypes.blueprint} is a very short summary of the overall architecture of the project. It talks about what programming languages are used, major frameworks, and so forth. 
      2. ${promptFileTypes.aispec} is another useful file that has short summaries of all of the important code in the project. 
      3. ${promptFileTypes.projectsource} is the concatenation of all of the source code in the project.

      For all questions asked of you, use the ${promptFileTypes.blueprint} and ${promptFileTypes.aispec} files. Retrieve code snippets as needed from the concatenated code file ${promptFileTypes.projectsource}.

      Important: When asked a question that identifies invidiual work items required to complete the project goal named ${goalName} you should record the 
      individual work items in our database using the submitWorkItemsForGoal function provided to you. Each individual work item needs the following details:
      1. Title
      2. Description
      3. Well defined acceptance criteria in a bullet list format (this will be used to determine when the work item is complete)

      You can then continue to response to the question as you normally would by provide both the answer as well as the individual work items you recorded 
      that are required to complete the project goal named ${goalName}.`
}

const mapPromptFileInfosToPromptFileTypes = (
  promptFileInfos: PromptFileInfo[],
): PromptFileTypes => {
  let identifiedPromptFileTypes: PromptFileTypes = {
    aispec: '',
    blueprint: '',
    projectsource: '',
  }

  promptFileInfos.map(({ name, type }) => {
    identifiedPromptFileTypes[type as keyof PromptFileTypes] = name
  })

  return identifiedPromptFileTypes
}

export const updateAssistantForProjectGoalContextualization = async (
  promptFileInfos: PromptFileInfo[],
  goalName: string,
  goalDescription: string,
  assistantMetadata: AssistantMetadata,
): Promise<Assistant> => {
  const assistant = await findAssistantFromMetadata(assistantMetadata)

  if (!assistant) {
    console.debug(
      `Failed to find an assistant when updating one for project goal '${goalName}' contextualization using the following metadata: ${JSON.stringify(
        assistantMetadata,
      )}`,
    )
    throw new Error(
      `Failed to find an assistant when updating one for project goal contextualization`,
    )
  }

  const fileIDs = promptFileInfos.map(({ id }) => id)
  const identifiedPromptFileTypes =
    mapPromptFileInfosToPromptFileTypes(promptFileInfos)
  const prompt = createOpenAIAssistantPromptForGoals(
    identifiedPromptFileTypes,
    goalName,
    goalDescription,
  )

  return oaiClient.beta.assistants.update(assistant.id, {
    file_ids: fileIDs,
    instructions: prompt,
    tools: [
      { type: 'code_interpreter' },
      { type: 'retrieval' },
      submitTaskStepsAssistantFunction,
    ],
  })
}

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
  assistantId: string,
  threadId: string,
): Promise<Run> => {
  return oaiClient.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  })
}

export const addQueryToThreadForProjectGoalChatting = async (
  threadId: string,
  chatQueryId: string,
  query: string
) => {
  const messageMetadata = {
    chatQueryId,
  }

  await oaiClient.beta.threads.messages.create(threadId, {
    role: 'user',
    content: query,
    metadata: messageMetadata
  })
}

export const getChatQueryResponseFromThread = async (threadId: string, chatQueryId: string): Promise<string> => {
  const { data: messages } = await oaiClient.beta.threads.messages.list(
    threadId
  )

  const messageMetadata = {
    chatQueryId
  }

  // Find the index of the user query to OpenAI that we are tracking in our
  // datastore as a chat query
  const chatQueryIndex = messages.findIndex((message) => {
    const metadata = message.metadata as { chatQueryId: string }

    if (metadata.chatQueryId && metadata.chatQueryId === chatQueryId && message.role === 'user') {
      return true
    }

    return false
  })

  // If we didn't find it throw an error. Typically we check for -1 indicating
  // the index wasn't found but we also want to ensure that the corresponding
  // user query isn't the first one in the messages array. This would denote
  // that there aren't any assistant responses either.
  if (chatQueryIndex < 1) {
    throw new Error(`Unable to locate user chat query with an ID of '${chatQueryId}'`)
  }

  // Presuming that the messages returned by OpenAI are listed with the most
  // recent message as the first index in the array returned take a slice of the
  // responses up to our user query.
  const assistantMessages = messages.slice(0, chatQueryIndex)
  const chatQueryResponse = assistantMessages.reduce((concatenatedMessage, assistantMessage) => {
    const { content: contents } = assistantMessage

    contents.forEach((content) => {
      if (content.type !== 'text') {
        throw new Error(`Tried to process unrecognized content type '${content.type}' for chat query with an ID of '${chatQueryId}'`)
      }

      const textContent = content.text

      // Handle citations to files the assistant included in the message
      const annotations = textContent.annotations
      const citations: string[] = []

      annotations.forEach(async (annotation, index) => {
        // Replace the text with a footnote
        textContent.value = textContent.value.replace(
          annotation.text,
          ` [${index}]`
        )

        if (annotation.type !== 'file_citation' && annotation.type !== 'file_path') {
          throw new Error(`Tried to process unrecognized annotation type for chat query with an ID of '${chatQueryId}'`)
        }

        // Handle citations within a message that points to a specific quote
        // from a specific file associated with the assistant or message. This
        // citation is generated when the assistant uses the 'retrieval' tool to
        // search files.
        if (annotation.type === 'file_citation') {
          const citedFile = await oaiClient.files.retrieve(
            annotation.file_citation.file_id
          )

          citations.push(`[${index}] ${annotation.file_citation.quote} from ${citedFile.filename}`)
        }

        // Handle citation within a message that generated a URL for the file
        // the assistant used the 'code_interpreter' tool to generate a file.
        if (annotation.type === 'file_path') {
          const citedFile = await oaiClient.files.retrieve(
            annotation.file_path.file_id
          )

          citations.push(`[${index}] Click <here> to download ${citedFile.filename}`)
        }

        // Note: Actual file download link or mechanism to trigger downloads not implemented
      })

      textContent.value += '\n' + citations.join('\n')

      concatenatedMessage += textContent.value
      concatenatedMessage += '\n'
    })

    return concatenatedMessage
  }, '').trim()

  return chatQueryResponse
}

export const getThreadRunForProjectGoalChatting = async (threadId: string, threadRunId: string): Promise<Run> => {
  return oaiClient.beta.threads.runs.retrieve(threadId, threadRunId)
}