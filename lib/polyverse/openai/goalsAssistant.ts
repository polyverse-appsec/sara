import OpenAI from 'openai'
import { Assistant } from 'openai/resources/beta/assistants/assistants'
import { Run } from 'openai/resources/beta/threads/runs/runs'
import { Thread } from 'openai/resources/beta/threads/threads'

import { type PromptFileInfo } from './../../../lib/data-model-types'
import { findAssistantFromMetadata, type AssistantMetadata } from './assistants'

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
  toolCallArgs: SubmitWorkItemsForGoalType,
) => {
  if (toolCallArgs) {
    // TODO: Once we verify that the assistant is creating invidiaul work items for goals
    // we need to add the task data type and actually persist them
    toolCallArgs.workItems.forEach((workItem) => {
      console.log(
        `***** assistant generated the following task for a goal with an ID of '${goalId}': ${JSON.stringify(
          workItem,
        )}`,
      )
    })
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
