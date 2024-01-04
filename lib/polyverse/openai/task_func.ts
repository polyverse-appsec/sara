import { Assistant } from 'openai/resources/beta/assistants/assistants'

export const task_func: Assistant.Function = {
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
