import { Assistant } from 'openai/resources/beta/assistants/assistants'
import { Repository, Task } from '@/lib/types'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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

export async function handleTaskAction(
  data: any,
  repo: Repository,
  task: Task
) {
  //for now, we just log the task steps to the console
  data.required_action.submit_tool_outputs.forEach((call: any) => {
    console.log(`Task step: ${call.function.arguments}`)
  })

  const toolOutputs = data.required_action.submit_tool_outputs.tool_calls.map(
    (call: { id: string }) => {
      return {
        tool_call_id: call.id,
        output: 'finished'
      }
    }
  )

  const run = await openai.beta.threads.runs.submitToolOutputs(
    data.thread_id,
    data.id,
    {
      tool_outputs: toolOutputs
    }
  )
}
