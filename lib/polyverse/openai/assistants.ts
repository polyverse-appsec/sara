import OpenAI from 'openai'

import { Assistant } from 'openai/resources/beta/assistants/assistants'

import { DEMO_EMAIL_ADDRESS } from '../config'
import { getFileIDs } from '../backend/backend'
import { isRecord } from '../typescript/helpers'

import { OPENAI_MODEL } from './constants'
import { task_func } from './task_func'
import { Repository } from '@/lib/types'

const PV_OPENAI_ASSISTANT_NAME = 'Polyverse Boost Sara'
const PV_OPENAI_ASSISTANT_INSTRUCTIONS =
  'You are a coding assistant named Sara. ' +
  'You have access to the full codebase of a project in your files, including an aispec.md file that summarizes the code. ' +
  'When asked a coding question, unless otherwise explicitly told not to, you give answers that use the relevant frameworks, APIs, data structures, and other aspects of the existing code. ' +
  'There are at least three files in your files that will help you answer questions. ' +
  '1. blueprint.md is a very short summary of the overall architecture. It talks about what programming languages are used, major frameworks, and so forth. ' +
  '2. aispec.md is another useful, medium size file. It has short summaries of all of the important code. ' +
  '3. Finally, allfiles_concat.md is the concatenation of all of the source code in the project. ' +
  'For all queries, use the blueprint and aispec files. Retrieve code snippets as needed from the concatenated code file.' +
  'If you are asked a question that requires multiple steps, you should record the steps in a task management database ' +
  'using the submitTaskSteps function. ' +
  'And then continue to respond as you normally would (i.e. give both the answer and call the submitTaskSteps function). '

const oaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Creates an OpenAI assistant with files attached to it (by ID) from the repo provided.
 *
 * @param {string[]} fileIDs Array of file IDs.
 * @param {string} repo Git URL associated with a repo.
 * @returns {Promise<Assistant>} Promise with the created OpenAI assistant.
 */
export async function createAssistantWithFileIDsFromRepo(
  fileIDs: string[],
  repo_full_name: string
): Promise<Assistant> {
  return await oaiClient.beta.assistants.create({
    model: OPENAI_MODEL,
    name: PV_OPENAI_ASSISTANT_NAME,
    file_ids: fileIDs,
    instructions: PV_OPENAI_ASSISTANT_INSTRUCTIONS,
    tools: [{ type: 'code_interpreter' }, { type: 'retrieval' }, task_func],
    metadata: { repo_full_name }
  })
}

/**
 * Identifies a previously created OpenAI assistant based on a Git URL.
 *
 * @param {string} repo Git URL associated with an assistant.
 * @returns {(Promise<Assistant>|Promise<undefined>) Promise of identified assistant or Promise of undefined if no assistant found.
 */
export async function findAssistantForRepo(
  repo: string
): Promise<Assistant | undefined> {
  console.log(`findAssistantsForRepo`)
  // API call reference: https://platform.openai.com/docs/api-reference/assistants/listAssistants
  const assistants = await oaiClient.beta.assistants.list()

  // API Assistant object reference: https://platform.openai.com/docs/api-reference/assistants/object
  return assistants?.data?.find(
    ({ metadata }) => isRecord(metadata) && metadata.repo === repo
  )
}

/**
 * Updates the file IDs for an existing OpenAI assistant.
 *
 * @param {string[]} fileIDs Array of file IDs to associated with the existing OepnAI assistant.
 * @param {Assistant} assistant Existing OpenAI assistant with the 'id' field filled out
 * @returns Promise<Assistant> asdf
 */
export async function updateAssistantFileIDs(
  fileIDs: string[],
  { id }: { id: string }
): Promise<Assistant> {
  return await oaiClient.beta.assistants.update(id, { file_ids: fileIDs })
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
  repo: Repository,
  email: string
): Promise<Assistant> {
  // Get the file IDs associated with the repo first since we will end up
  // using them whether we need to create a new OpenAI assistant or there is
  // one already existing that we have its file IDs updated.
  const fileInfo = await getFileIDs(repo, email)

  const existingAssistant = await findAssistantForRepo(repo.full_name)

  //TODO we need to keep track of all of the fileID info, for now get the ID field
  const fileIDs = fileInfo.map(({ id }) => id)

  if (existingAssistant) {
    return await updateAssistantFileIDs(fileIDs, existingAssistant)
  }

  return await createAssistantWithFileIDsFromRepo(fileIDs, repo.full_name)
}
