import OpenAI from 'openai'
import { Assistant } from 'openai/resources/beta/assistants/assistants'

import {
  Project,
  ProjectDataReference,
  Repository,
} from '../../data-model-types'
import { getFileInfo } from '../backend/backend'
import { isRecord } from '../typescript/helpers'
import { submitTaskStepsAssistantFunction } from './assistantTools'
import { OPENAI_MODEL } from './constants'

export const ASSISTANT_METADATA_CREATOR = 'sara.frontend'

export const getVersion = () => {
  // this should only be env variable or something runtime - not hardcoded
  // TBD: To fix this, update deployment code to set the version globally
  return '0.7.1'
}

interface FileTypes {
  blueprint: string
  aispec: string
  projectsource: string
}

export interface AssistantMetadata {
  projectId: string
  version?: string
  userName: string
  creator: string
  orgName: string
}

function createAssistantName(metadata: AssistantMetadata): string {
  // remove spaces and special characters from project-id and create a simple underscore delimited
  // string to use as part of the assistant name
  const projectId = metadata.projectId.replace(/[^a-zA-Z0-9]/g, '_')
  return `${metadata.creator}-${metadata.version}-${metadata.orgName}-${metadata.userName}-${projectId}`
}

function getOpenAIAssistantInstructions(fileTypes: FileTypes): string {
  return `
    You are a coding assistant named Sara. 
    You have access to the full codebase of a project in your files, including an ${fileTypes.aispec} file that summarizes the code. 
    When asked a coding question, unless otherwise explicitly told not to, you give answers that use the relevant frameworks, APIs, data structures, and other aspects of the existing code. 
    There are at least three files in your files that will help you answer questions. 
    1. ${fileTypes.blueprint} is a very short summary of the overall architecture. It talks about what programming languages are used, major frameworks, and so forth. 
    2. ${fileTypes.aispec} is another useful, medium size file. It has short summaries of all of the important code. 
    3. ${fileTypes.projectsource} is the concatenation of all of the source code in the project. 
    For all queries, use the ${fileTypes.blueprint} and ${fileTypes.aispec} files. Retrieve code snippets as needed from the concatenated code file ${fileTypes.projectsource}.
    
    Important: If you are asked a question that requires multiple steps, you should record the steps in a task management database 
    using the submitTaskSteps function. 
    And then continue to respond as you normally would (i.e. give both the answer and call the submitTaskSteps function). `
}

const oaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function mapFileInfoToPromptAndIDs(fileInfos: ProjectDataReference[]) {
  let fileTypes: FileTypes = { aispec: '', blueprint: '', projectsource: '' }
  fileInfos.map(({ name, type }) => {
    fileTypes[type as keyof FileTypes] = name
  })

  const prompt = getOpenAIAssistantInstructions(fileTypes)

  const fileIDs = fileInfos.map(({ id }) => id)
  return { prompt, fileIDs }
}

export async function createAssistant(
  fileInfos: ProjectDataReference[],
  assistantMetadata: AssistantMetadata,
): Promise<Assistant> {
  const { prompt, fileIDs } = mapFileInfoToPromptAndIDs(fileInfos)
  const assistantName = createAssistantName(assistantMetadata)

  return await oaiClient.beta.assistants.create({
    model: OPENAI_MODEL,
    name: assistantName,
    file_ids: fileIDs,
    instructions: prompt,
    tools: [
      { type: 'code_interpreter' },
      { type: 'retrieval' },
      submitTaskStepsAssistantFunction,
    ],
    metadata: assistantMetadata,
  })
}

export async function findAssistantFromMetadata(
  metadata: AssistantMetadata,
): Promise<Assistant | undefined> {
  // API call reference: https://platform.openai.com/docs/api-reference/assistants/listAssistants
  const assistants = await oaiClient.beta.assistants.list()

  // API Assistant object reference: https://platform.openai.com/docs/api-reference/assistants/object
  return assistants?.data?.find(
    ({ metadata: retrievedMetadata }) =>
      isRecord(retrievedMetadata) &&
      retrievedMetadata.projectId === metadata.projectId &&
      retrievedMetadata.creator === ASSISTANT_METADATA_CREATOR &&
      retrievedMetadata.userName === metadata.userName &&
      retrievedMetadata.org === metadata.orgName,
    // We can do version upgrades (e.g. if a major or minor Sara version comes out
    //   we can fail the match on a version compare and then create a new assistant
    //   with the new version of Sara)
  )
}

/**
 * Updates the file IDs for an existing OpenAI assistant.
 *
 * @param {string[]} fileIDs Array of file IDs to associated with the existing OepnAI assistant.
 * @param {Assistant} assistant Existing OpenAI assistant with the 'id' field filled out
 * @returns Promise<Assistant> asdf
 */
export async function updateAssistantPromptAndFiles(
  fileInfos: ProjectDataReference[],
  { id }: { id: string },
): Promise<Assistant> {
  const { prompt, fileIDs } = mapFileInfoToPromptAndIDs(fileInfos)

  return await oaiClient.beta.assistants.update(id, {
    file_ids: fileIDs,
    instructions: prompt,
  })
}

// An OpenAI Assistant is the logical representation of an AI assistant we have
// built for our own application - in this case Sara.
//
// Sara has instructions and can leverage models, tools, and knowledge to
// respond to any user queries she gets.
//
// The workflow to use an assistant is:
// 1. Create OpenAI Assistant object providing instructions and a model
// 2. Create a OpenAI Thread for any user initiated conversations
// 3. Add OpenAI Messages to the Thread as user asks questions
// 4. Run the Assistant on Thread to trigger responses (tooling automatically invoked)

export async function configAssistant(
  project: Project,
  repos: Repository[],
  email: string,
  billingOrgId: string,
): Promise<Assistant> {
  // Get the file IDs associated with the repo first since we will end up
  // using them whether we need to create a new OpenAI assistant or there is
  // one already existing that we have its file IDs updated.

  //build the array of fileInfos by looping through the repos
  //and getting the fileInfo for each repo
  let fileInfos: ProjectDataReference[] = []
  for (const repo of repos) {
    const fileInfo = await getFileInfo(project.name, repo, email)
    fileInfos = fileInfos.concat(fileInfo)
  }

  const existingAssistantMetadata: AssistantMetadata = {
    projectId: project.name,
    userName: email,
    orgName: billingOrgId,
    creator: '', // ignore this match
    version: '', // ignore this match
  }

  const existingAssistant = await findAssistantFromMetadata(
    existingAssistantMetadata,
  )

  if (existingAssistant) {
    return await updateAssistantPromptAndFiles(fileInfos, existingAssistant)
  }

  const newAssistantMetadata: AssistantMetadata = {
    projectId: project.name,
    userName: email,
    orgName: project.org,
    creator: ASSISTANT_METADATA_CREATOR,
    version: getVersion(),
  }

  return await createAssistant(
    fileInfos,
    newAssistantMetadata,
  )
}

export async function deleteAssistant(assistantId: string) {
  await oaiClient.beta.assistants.del(assistantId)
}

export async function deleteAssistantFiles(assistant: Assistant) {
  if (!assistant.file_ids) {
    return
  }

  const fileDeletePromises = assistant.file_ids.map((id) => oaiClient.beta.assistants.files.del(
    assistant.id, id
  ))

  await Promise.all(fileDeletePromises)
}