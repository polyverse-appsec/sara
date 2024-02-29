import { create } from 'domain'
import OpenAI from 'openai'
import { Assistant } from 'openai/resources/beta/assistants/assistants'

import { Task } from '../../data-model-types'
import { createTask } from './../../../app/_actions/create-task'
import { nanoid } from './../../utils'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
                description: 'The title of the task.',
              },
              description: {
                type: 'string',
                description:
                  'The description of the task to be done in markdown format.',
              },
            },
          },
        },
      },
      required: ['tasks'],
    },
  },
}

const buildTaskInstance = (
  userId: string,
  projectName: string,
  { title, description }: TaskForGoalType,
): Task => {
  return {
    id: nanoid(),
    title,
    description,
    createdAt: new Date(),
    userId,
    projectId: projectName,
    chats: [],
    subtasks: [],
  }
}

/**
 * Type representing the task information the OpenAI Assistant will provide us
 * when she invokes the `submitTaskSteps`.
 */
export type TaskForGoalType = {
  /** Title of the task */
  title: string

  /** Description of the task */
  description: string
}

/**
 * Type representing the type of info we can expect to get from the OpenAI
 * Assistant running on a thread that is requesting to invoke the
 * `submitTaskSteps`.
 */
export type SubmitTasksForGoalType = {
  tasks: TaskForGoalType[]
}

const getBuildTaskInstanceClosure = (userID: string, projectName: string) => {
  // Return a function that can be invoked to map a `TaskForGoalType` which we
  // receive from Sara when she tries to invoke the `submitTaskSteps` function
  // to a `Task` instance from our data model.
  //
  // Commonly used for persistence purposes
  return (task: TaskForGoalType) => {
    return buildTaskInstance(userID, projectName, task)
  }
}

export const submitTaskSteps = async (
  userID: string,
  projectName: string,
  toolCallArgs: SubmitTasksForGoalType,
) => {
  if (toolCallArgs) {
    const tasksToPersist = toolCallArgs.tasks.map(
      getBuildTaskInstanceClosure(userID, projectName),
    )

    tasksToPersist.forEach((task: Task) => createTask(projectName, task))
  }
}
