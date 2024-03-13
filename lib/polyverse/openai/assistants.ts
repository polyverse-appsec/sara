import OpenAI from 'openai'
import { Assistant } from 'openai/resources/beta/assistants/assistants'

import {
  Project,
  ProjectDataReference,
  Repository,
  type PromptFileInfo,
} from '../../data-model-types'
import { getFileInfo } from '../backend/backend'
import { isRecord } from '../typescript/helpers'
import { submitTaskStepsAssistantFunction } from './assistantTools'
import { OPENAI_MODEL } from './constants'
import { mapPromptFileInfosToPromptFileTypes, type PromptFileTypes } from './../../../lib/polyverse/openai/utils'


export const ASSISTANT_METADATA_CREATOR = 'sara.frontend'

export const getVersion = () => {
  // TODO: This should only be an env var or something set at runtime - not
  // hardcoded. This needs to always be in sync with the versions listed in
  // the `CHANGELOG.md` and `package.json` files
  return '0.14.0'
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

// Note that this function uses the new type `PromptFileTypes` which we have
// designed as part of a data model/UI/Open AI logic refresh. Other functions
// in this file use the old `FileTypes` type. Once we have fully cut over to
// the new UI that consumes this new data model/Open AI logic  we ought to
// update the other functions to use the new type.
function getOpenAIAssistantInstructions(fileTypes: FileTypes | PromptFileTypes): string {
  // This prompt was engineered to guide Sara on what she will be doing
  // overall when she is created as an OpenAI Assistant. When specific questions
  // are asked of her in a Thread and she is told to provide an answer to the
  // question by performing a Thread Run each Thread Run ought to override the
  // instructions if it will help Sara focus on the type of answer she ought to
  // provide.
  return `
      You are a software architecture assistant as well as a coding assistant named Sara.
      You have access to the full codebase of a project in your files, including a file named ${fileTypes.aispec} that summarizes the code.

      Questions asked of you will be similiar to - but not exhaustive of - the bulleted list below:
      * Questions focused on understanding and trying to define more granular work-items for high-level project goals
      * Questions focused on trying to accomplish/complete a specific work-item that is associated with and required to complete a high-level project goal
      * Questions focused on code/coding about the project where answers ought to use the relevant frameworks, APIs, data structures, and other aspects of the existing code
      * Questions focused on software architecture and principals

      If it is helpful you will be given additional details about how to answer specific types of questions when you go to answer them.

      There are at least three files you have access to that will help you answer questions:
      1. ${fileTypes.blueprint} is a very short summary of the overall architecture of the project. It talks about what programming languages are used, major frameworks, and so forth.
      2. ${fileTypes.aispec} is another useful file that has short summaries of all of the important code in the project.
      3. ${fileTypes.projectsource} is the concatenation of all of the source code in the project.

      For all questions asked of you, use the ${fileTypes.blueprint} and ${fileTypes.aispec} files. Retrieve code snippets as needed from the concatenated code file ${fileTypes.projectsource}.
  `
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
    tools: [{ type: 'code_interpreter' }, { type: 'retrieval' }],
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
      retrievedMetadata.orgName === metadata.orgName,
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
    const fileInfo = await getFileInfo(project.name, billingOrgId, email)
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

  return await createAssistant(fileInfos, newAssistantMetadata)
}

export async function deleteAssistant(assistantId: string) {
  await oaiClient.beta.assistants.del(assistantId)
}

export async function deleteAssistantFiles(assistant: Assistant) {
  if (!assistant.file_ids) {
    return
  }

  const fileDeletePromises = assistant.file_ids.map((id) =>
    oaiClient.beta.assistants.files.del(assistant.id, id),
  )

  await Promise.all(fileDeletePromises)
}

// Note that this function uses the new type `PromptFileInfo` which we have
// designed as part of a data model refresh. Other functions in this file use
// the old `ProjectDataReference` type. Once we have fully cut over to the new
// UI that consumes this new data model we ought to update the other functions
// to use the new type.
export const updateAssistantForPromptFileInfos = async (
  promptFileInfos: PromptFileInfo[],
  assistantMetadata: AssistantMetadata,
): Promise<Assistant> => {
  const assistant = await findAssistantFromMetadata(assistantMetadata)

  if (!assistant) {
    console.debug(
      `Failed to find an assistant when updating one for prompt file infos using the following metadata: ${JSON.stringify(
        assistantMetadata,
      )}`,
    )

    throw new Error(
      `Failed to find an assistant when updating one for prompt file infos`,
    )
  }

  const fileIDs = promptFileInfos.map(({ id }) => id)
  const identifiedPromptFileTypes =
    mapPromptFileInfosToPromptFileTypes(promptFileInfos)

  const prompt = getOpenAIAssistantInstructions(
    identifiedPromptFileTypes,
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
