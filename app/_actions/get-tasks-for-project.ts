'use server'

import { kv } from '@vercel/kv'

import { auth } from './../../auth'

import { type Task, type Project } from './../../lib/data-model-types'

// TODO: DRY and move to db/keys and test - there is a copy of this elsewhere
const createUserIdUserRepoTasksRepoIdKey = (userId: string, projectName: string) => `user:${userId}:repo:tasks:${projectName}`

export const getTasksForProject = async (
    project: Project,
  ): Promise<Task[]> => {
    const session = await auth()
  
    if (!session?.user?.id || session.user.id !== project.userId) {
      throw new Error('Unauthorized')
    }
  
    // First start by getting all of tasks associated with a user...
    const key = createUserIdUserRepoTasksRepoIdKey(session.user.id, project.name)
    const taskKeys = (await kv.zrange(key, 0, -1)) as string[]
  
    if (taskKeys.length === 0) {
      return []
    }
  
    // Then get all of the tasks for the user based on the retrieved IDs...
    const taskPipeline = kv.pipeline()
    taskKeys.forEach((taskKey) => taskPipeline.hgetall(taskKey))
  
    const tasks = (await taskPipeline.exec()) as Task[]
  
    return tasks
}