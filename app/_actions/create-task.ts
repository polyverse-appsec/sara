'use server'

import { kv } from '@vercel/kv'

import { auth } from './../../auth'
import { type Task } from './../../lib/data-model-types'
import setTask from './../../lib/polyverse/db/set-task'
import { nanoid } from './../../lib/utils'

// TODO: DRY and move to db/keys and test - there is a copy of this elsewhere
const createUserIdUserRepoTasksRepoIdKey = (
  userId: string,
  projectName: string,
) => `user:${userId}:repo:tasks:${projectName}`

export async function createTask(
  projectName: string,
  task: Task,
): Promise<Task> {
  const session = await auth()
  console.debug(`Invoking server action: createTask`)

  if (!session?.user?.id || task.userId !== session.user.id) {
    throw new Error('Unauthorized')
  }

  const id = task.id || nanoid()
  const createdAt = task.createdAt || new Date()
  const taskData = {
    ...task,
    id,
    createdAt,
  }

  await setTask(taskData)

  await kv.zadd(
    createUserIdUserRepoTasksRepoIdKey(session.user.id, projectName),
    {
      score: +createdAt,
      member: `task:${id}`,
    },
  )

  return taskData
}
