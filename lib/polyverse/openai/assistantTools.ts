import { Assistant } from 'openai/resources/beta/assistants/assistants'
import { Repository, Task } from '@/lib/types'
import OpenAI from 'openai'
import { Run } from 'openai/resources/beta/threads/runs/runs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const submitTaskStepsAssistantFunction: Assistant.Function = {
  type: 'function',
  function: {
    name: 'submitTaskSteps',
    description:
      'If an answer requires multiple steps, this function will let us record the steps needed in our task management database.',
    parameters: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'The title of the task.'
              },
              description: {
                type: 'string',
                description:
                  'The description of the task to be done in markdown format.'
              }
            }
          }
        }
      },
      required: ['tasks']
    }
  }
}

export type TaskForGoalType = {
  title: string
  description: string
}

export type SubmitTasksForGoalType = {
  tasks: TaskForGoalType[]
}

export const submitTaskSteps = async (toolCallArgs: SubmitTasksForGoalType) => {
  if (toolCallArgs) {
    toolCallArgs.tasks.forEach(({title, description}) => console.log(`Persist task with title '${title}' with description of: ${description}`))
  }
}
