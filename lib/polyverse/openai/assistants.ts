import OpenAI from 'openai'
import { Assistant } from 'openai/resources/beta/assistants/assistants'

import { Project, ProjectDataReference, Repository } from '../../data-model-types'

import { getFileInfo } from '../backend/backend'
import { isRecord } from '../typescript/helpers'
import { submitTaskStepsAssistantFunction } from './assistantTools'
import { OPENAI_MODEL } from './constants'

const PV_OPENAI_ASSISTANT_NAME = 'Polyverse Boost Sara'

interface FileTypes {
  blueprint: string
  aispec: string
  projectsource: string
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

// TODO: Add comments to this method
function mapFileInfoToPromptAndIDs(fileInfos: ProjectDataReference[]) {
  // TODO: Add comments about the significance of these file types
  let fileTypes: FileTypes = { aispec: '', blueprint: '', projectsource: '' }
  fileInfos.map(({ name, type }) => {
    fileTypes[type as keyof FileTypes] = name
  })

  const prompt = getOpenAIAssistantInstructions(fileTypes)

  const fileIDs = fileInfos.map(({ id }) => id)
  return { prompt, fileIDs }
}
/**
 * Creates an OpenAI assistant with files attached to it (by ID) from the repo provided.
 *
 * @param {string[]} fileIDs Array of file IDs.
 * @param {string} repo Git URL associated with a repo.
 * @returns {Promise<Assistant>} Promise with the created OpenAI assistant.
 */
export async function createAssistantWithFileIDsFromRepo(
  fileInfos: ProjectDataReference[],
  repo_full_name: string,
): Promise<Assistant> {
  const { prompt, fileIDs } = mapFileInfoToPromptAndIDs(fileInfos)

  return await oaiClient.beta.assistants.create({
    model: OPENAI_MODEL,
    name: PV_OPENAI_ASSISTANT_NAME,
    file_ids: fileIDs,
    instructions: prompt,
    tools: [
      { type: 'code_interpreter' },
      { type: 'retrieval' },
      submitTaskStepsAssistantFunction,
    ],
    metadata: { repo_full_name },
  })
}

/**
 * Identifies a previously created OpenAI assistant based on a Git URL.
 *
 * @param {string} repo Git URL associated with an assistant.
 * @returns {(Promise<Assistant>|Promise<undefined>) Promise of identified assistant or Promise of undefined if no assistant found.
 */
export async function findAssistantForRepo(
  repo: string,
): Promise<Assistant | undefined> {
  // API call reference: https://platform.openai.com/docs/api-reference/assistants/listAssistants
  const assistants = await oaiClient.beta.assistants.list()

  // API Assistant object reference: https://platform.openai.com/docs/api-reference/assistants/object
  return assistants?.data?.find(
    ({ metadata }) => isRecord(metadata) && metadata.repo_full_name === repo,
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

/**
 * Configures an OpenAI assistant for use. Will identify relevant file IDs from a Git repo and
 * associate it with the OpenAI assistant. If the assistant doesn't yet exist it will create it
 * first.
 *
 * @param {string} repo Git URL to identify relevant file IDs for
 * @returns {Promise<Assistant>} Promise with the configured OpenAI assistant
 */
export async function configAssistant(
  project: Project,
  repos: Repository[],
  email: string,
): Promise<Assistant> {
  // Get the file IDs associated with the repo first since we will end up
  // using them whether we need to create a new OpenAI assistant or there is
  // one already existing that we have its file IDs updated.

  //build the array of fileInfos by looping through the repos
  //and getting the fileInfo for each repo
  let fileInfos: ProjectDataReference[] = []
  for (const repo of repos) {
    const fileInfo = await getFileInfo(repo, email)
    fileInfos = fileInfos.concat(fileInfo)
  }

  const existingAssistant = await findAssistantForRepo(project.name)

  if (existingAssistant) {
    return await updateAssistantPromptAndFiles(fileInfos, existingAssistant)
  }

  return await createAssistantWithFileIDsFromRepo(fileInfos, project.name)
}
