'use server'

import { kv } from '@vercel/kv'
import { userProjectIdsSetKey, userProjectKey } from 'lib/polyverse/db/keys'

import { auth } from './../../auth'
import { type User } from './../../lib/data-model-types'
import { deleteProject as deleteProjectBackend } from './../../lib/polyverse/backend/backend'
import getCachedProjectUserFileInfos from './get-cached-project-user-file-infos'
import { deleteCachedProjectUserFileInfos } from './delete-cached-project-user-file-infos'
import { type AssistantMetadata, findAssistantFromMetadata, deleteAssistantFiles, deleteAssistant } from './../../lib/polyverse/openai/assistants'

const createUserIdUserRepoTasksRepoIdKey = (
    userId: string,
    projectName: string,
  ) => `user:${userId}:repo:tasks:${projectName}`

async function deleteAllTasksForProject (userId: string, projectName: string): Promise<void> {
  // Start by getting all task keys associated with the user and project...
  const key = createUserIdUserRepoTasksRepoIdKey(userId, projectName);
  const taskKeys = (await kv.zrange(key, 0, -1)) as string[];
 
  if (taskKeys.length === 0) {
    console.log('No tasks to delete for the project');
    return;
  }

  // Then delete all of the tasks for the user based on the retrieved keys...
  const deletePipeline = kv.pipeline();
  taskKeys.forEach((taskKey) => {
    // Assuming tasks are stored as hashes, we use del to remove them
    deletePipeline.del(taskKey);
    // Additionally, remove the task key from the sorted set of task keys
    deletePipeline.zrem(key, taskKey);
  });
  
  await deletePipeline.exec();
  
  console.log(`***** deleteAllTasksForProject - All tasks deleted for project: ${projectName}`);
};

async function deleteProjectVercel(
  userId: string,
  projectId: string,
  projectName: string
): Promise<void> {
  // Generate the keys needed to locate the project in the k/v store
  const setKey = userProjectIdsSetKey(userId)
  const itemKey = userProjectKey(userId, projectId)

  // Remove the project data from the k/v store
  await kv.del(itemKey)

  // Remove the project ID from the user's set of project IDs
  await kv.zrem(setKey, itemKey)
  console.log(`Deleted project ${projectId} for user ${userId}`)

  // tasks are not deleted by just deleting the project, so need to delete the tasks associated w/ projectname separately
  await deleteAllTasksForProject(userId, projectName)
}

export const deleteProject = async (
  orgId: string,
  user: User,
  projectName: string,
  projectId: string,
) => {
  const session = await auth()

  if (!session?.user?.id || user?.id !== session.user.id || !user.email) {
    throw new Error('Unauthorized')
  }

  // First clean up ancillary resources...
  const cachedFileInfos = await getCachedProjectUserFileInfos(projectName, user)
  await deleteCachedProjectUserFileInfos(user, projectName, cachedFileInfos)

  // Secondaly delete any OpenAI resources...
  const existingAssistantMetadata: AssistantMetadata = {
    projectId: projectName,
    userName: user.email!,
    org: orgId,
    creator: '', // ignore creator for search
    version: '', // ignore version for search
  }

  const existingAssistant = await findAssistantFromMetadata(existingAssistantMetadata)

  if (existingAssistant) {
    await deleteAssistantFiles(existingAssistant)
    await deleteAssistant(existingAssistant.id)
  }

  await deleteProjectBackend(orgId, projectName, user.email)
  await deleteProjectVercel(user.id, projectId, projectName)
}
