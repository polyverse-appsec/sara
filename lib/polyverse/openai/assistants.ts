
import OpenAI from 'openai'

import { Assistant } from 'openai/resources/beta/assistants/assistants'

import { isRecord } from '../typescript/helpers'
import { getFileIDs } from '../backend/backend'

import { DEMO_EMAIL_ADDRESS } from '../config'

const OPENAI_MODEL = 'gpt-4-1106-preview'
const OPENAI_ASSISTANT_TOOL_CODE_INTERPRETER = 'code_interpreter'
const OPENAI_ASSISTANT_TOOL_CODE_RETRIEVAL = 'retrieval'

const PV_OPENAI_ASSISTANT_NAME = 'Polyverse Boost Sara'
const PV_OPENAI_ASSISTANT_INSTRUCTIONS = 'You are a coding assistant named Sara. You have access to the full codebase of a project in your files, including an aispec.md file that summarizes the code. When asked a coding question, unless otherwise explicitly told not to, you give answers that use the relevant frameworks, apis, data structures, and other aspects of the existing code.  There are at least three files in your files that will help you answer questions.  1. blueprint.md is a very short summary of the overall architecture. It talks about what programming languages are used, major frameworks, and so forth.  2. aispec.md is another useful, medium size file. It has short summaries of all of the important code.  Finally, allfiles_concat.md is the concatenation of all of the source code in the project.  For all queries, use the blueprint and aispec files. Retrieve code snippets as needed from the concatenated code file.'


// TODO: Is this a singleton? Ramifications if it isnt?
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
export async function createAssistantWithFileIDsFromRepo(fileIDs: string[], repo: string): Promise<Assistant> {
    return await oaiClient.beta.assistants.create({
      model: OPENAI_MODEL,
      name: PV_OPENAI_ASSISTANT_NAME,
      file_ids: fileIDs,
      instructions: PV_OPENAI_ASSISTANT_INSTRUCTIONS,
      tools: [{ type: OPENAI_ASSISTANT_TOOL_CODE_INTERPRETER }, { type: OPENAI_ASSISTANT_TOOL_CODE_RETRIEVAL }],
      metadata: { repo }
    })
}

/**
 * Identifies a previously created OpenAI assistant based on a Git URL.
 * 
 * @param {string} repo Git URL associated with an assistant.
 * @returns {(Promise<Assistant>|Promise<undefined>) Promise of identified assistant or Promise of undefined if no assistant found.
 */
export async function findAssistantForRepo(repo: string): Promise<Assistant | undefined> {
    console.log(`findAssistantsForRepo`)
    // API call reference: https://platform.openai.com/docs/api-reference/assistants/listAssistants
    const assistants = await oaiClient.beta.assistants.list()
  
    // API Assistant object reference: https://platform.openai.com/docs/api-reference/assistants/object
    return assistants?.data?.find(({ metadata }) => isRecord(metadata) && metadata.repo === repo)
}

/**
 * Updates the file IDs for an existing OpenAI assistant.
 * 
 * @param {string[]} fileIDs Array of file IDs to associated with the existing OepnAI assistant.
 * @param {Assistant} assistant Existing OpenAI assistant with the 'id' field filled out
 * @returns Promise<Assistant> asdf 
 */
export async function updateAssistantFileIDs(fileIDs: string[], { id }: { id: string }): Promise<Assistant> {
    return await oaiClient.beta.assistants.update(id, { file_ids: fileIDs })
}

/**
 * Configures an OpenAI assistant for use. Will identify relevant file IDs from a Git repo and
 * associate it with the OpenAI assistant. If the assistant doesn't yet exist it will create it
 * first.
 * 
 * @param {string} repo Git URL to identify relevant file IDs for
 * @returns {Promise<Assistant>} Promise with the configured OpenAI assistant
 */
export async function configAssistant(repo: string): Promise<Assistant> {
    // Get the file IDs associated with the repo first since we will end up
    // using them whether we need to create a new OpenAI assistant or there is
    // one already existing that we have its file IDs updated.
    const fileIDs = await getFileIDs(repo, DEMO_EMAIL_ADDRESS)

    const existingAssistant = await findAssistantForRepo(repo)

    if (existingAssistant) {
        return await updateAssistantFileIDs(fileIDs, existingAssistant)
    }

    return await createAssistantWithFileIDsFromRepo(fileIDs, repo)
}