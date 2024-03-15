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
import {
  mapPromptFileInfosToPromptFileTypes,
  type PromptFileTypes,
} from './../../../lib/polyverse/openai/utils'
import { submitTaskStepsAssistantFunction } from './assistantTools'
import { OPENAI_MODEL } from './constants'
import { BoostProjectStatus } from '../backend/get-boost-project-status'

export const ASSISTANT_METADATA_CREATOR = 'sara.frontend'

export const getVersion = () => {
  // TODO: This should only be an env var or something set at runtime - not
  // hardcoded. This needs to always be in sync with the versions listed in
  // the `CHANGELOG.md` and `package.json` files
  return '0.16.0'
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
function getOpenAIAssistantInstructions(
  fileTypes: FileTypes | PromptFileTypes,
  projectStatus?: BoostProjectStatus,
  project?: Project // TODO: need project info (e.g. name, description, etc) - this is never passed in
): string {
  // This prompt was engineered to guide Sara on what she will be doing
  // overall when she is created as an OpenAI Assistant. When specific questions
  // are asked of her in a Thread and she is told to provide an answer to the
  // question by performing a Thread Run each Thread Run ought to override the
  // instructions if it will help Sara focus on the type of answer she ought to
  // provide.
  let assistantPromptInstructions = `
      You are a software architecture assistant as well as a coding assistant named Sara.
      `;

  try {
    if (project?.name) {
        assistantPromptInstructions += `
        You are advising a software engineer with the project named ${project.name}.`;
    }
    if (project?.description) {
        assistantPromptInstructions += ` The project description is: ${project.description}`;
    }
    if (project?.mainRepository?.html_url) {
        assistantPromptInstructions += ` The main GitHub repository for the project is located at: ${project.mainRepository.html_url}`;
    }
    if (project?.referenceRepositories?.length) {
      assistantPromptInstructions += ` The project also has ${project.referenceRepositories.length} reference repositories:
      ${project.referenceRepositories.map((repo) => "\t" + repo.html_url).join('\t\n')}

      `;
    }

    const aiSpecStatus = projectStatus?.resourcesState?.find(
      (resource) => resource[0] === 'aispec'
      )?.[1];
    const blueprintStatus = projectStatus?.resourcesState?.find(
      (resource) => resource[0] === 'blueprint'
      )?.[1];
    const projectsourceStatus = projectStatus?.resourcesState?.find(
      (resource) => resource[0] === 'projectsource'
      )?.[1];

    // pretty print the last sync date and time in local time zone (note last synchronized is a Unix time in seconds
    const lastSynchronizedProjectDataAt = projectStatus?.lastSynchronized ? new Date(projectStatus.lastSynchronized * 1000).toLocaleString() : '';
    if (projectStatus?.synchronized) {
      assistantPromptInstructions += `You have fully reviewed the project code and analyzed each file to the best of your abilities.`;
    } else if (projectStatus?.activelyUpdating) {

      assistantPromptInstructions += `You are currently updating your understanding of the project code, and have not fully completed your analysis.`;

      // TODO: This is somewhat incomplete and speculative since it doesn't track how many files have been already imported or analyzed

      const estimatedFilesToProcess = projectStatus?.possibleStagesRemaining ? projectStatus.possibleStagesRemaining : 0;
      if (estimatedFilesToProcess > 1000) {
        assistantPromptInstructions += `You have a very incomplete and light understanding of the project code and haven't seen most of the code yet.`;
      } else if (estimatedFilesToProcess > 100) {
        assistantPromptInstructions += `You have a basic understanding of the project code. You have seen many files, but lack a deep understanding of the project.`;
      } else if (estimatedFilesToProcess > 10) {
       assistantPromptInstructions += `You have a good understanding of the project code. You have seen many files, and are close to a deep understanding of the project.`;
      }

      const numberOfMinutesEstimatedBeforeSynchronization = projectStatus?.possibleStagesRemaining ? Math.ceil(projectStatus.possibleStagesRemaining / 10) : 0;
      if (numberOfMinutesEstimatedBeforeSynchronization > 0) {
        assistantPromptInstructions += `You estimate that you will have a more complete understanding of the project in ${numberOfMinutesEstimatedBeforeSynchronization} minutes.`;
      }

      assistantPromptInstructions += `When you answer user questions, you should remind the user that you are still researching their code and better answers will be available soon.`;

      // the project isn't fully synchronized, and there are no active updates at the moment - so we may be in an error state, or we've paused/given up on updating
      //    temporarily. The backend analysis may resume, but we should be extra cautious about incomplete analysis.
    } else {
      if (aiSpecStatus === 'Error' || blueprintStatus === 'Error' || projectsourceStatus === 'Error') {
        assistantPromptInstructions += `You are currently having some trouble analyzing the project code. You are investigating the issues impacting your analysis, and will try to resume again. But you should be extra cautious about incomplete analysis.`;
      } else {
        assistantPromptInstructions += `You should be extra cautious about incomplete analysis and emphasize that caution to the user asking you questions.`;
      }
    }

    if (lastSynchronizedProjectDataAt) {
        assistantPromptInstructions += `Your last successful deep analysis of the project code was at ${lastSynchronizedProjectDataAt}.`;
    }

    if (projectsourceStatus === 'Complete' || projectsourceStatus === 'Processing') {
      assistantPromptInstructions += `
        You have access to the full codebase of project in your files in ${fileTypes.projectsource}.`;

        // if the file is in error, we will leave it out of the prompt
    } else {
      assistantPromptInstructions += `
        You do not have complete access to the full codebase of the project yet. You are still analyzing the codebase and hope to have access to it soon.
        If you are asked questions about specific code, you should remind the user that you are still researching their code and better answers will be available soon.`;
    }

    if (aiSpecStatus === 'Complete' || aiSpecStatus === 'Processing' || aiSpecStatus === 'Idle') {
      assistantPromptInstructions += `
        You have access to a file named ${fileTypes.aispec} that summarizes all of the project code.`;
    } else {
      assistantPromptInstructions += `
        You are having trouble analyzing the project code to build a good understanding, but you hope to overcome these challenges soon.
        If you are asked questions about structure, dependencies or the relationships between the code, you should remind the user that you are still researching their code and better answers will be available soon.`;
    }

    assistantPromptInstructions += `
        Questions asked of you will be similiar to - but not exhaustive of - the bulleted list below:
        * Questions focused on understanding and trying to define more granular work-items for high-level project goals
        * Questions focused on trying to accomplish/complete a specific work-item that is associated with and required to complete a high-level project goal
        * Questions focused on code/coding about the project where answers ought to use the relevant frameworks, APIs, data structures, and other aspects of the existing code
        * Questions focused on software architecture and principals

        If someone asks a more specific coding question about the project, unless otherwise explicitly told not to, you give answers that use the relevant frameworks, APIs, data structures, and other aspects of the existing code.
    }`;

    assistantPromptInstructions += `
      There are at least three files you have access to that will help you answer questions:`;
    if (blueprintStatus === 'Complete' || blueprintStatus === 'Processing' || blueprintStatus === 'Idle') {
      assistantPromptInstructions += `
        1. ${fileTypes.blueprint} is a very short summary of the overall architecture of the project. It talks about what programming languages are used, major frameworks, and so forth.`;
    } else {
      assistantPromptInstructions += `
        1. ${fileTypes.blueprint} should contain a short architectural summary of the project, but it is having an issue and may not be reliable. You should be extra cautious about incomplete analysis.`;
    }

    if (aiSpecStatus === 'Complete' || aiSpecStatus === 'Processing' || aiSpecStatus === 'Idle') {
      assistantPromptInstructions += `
        2. ${fileTypes.aispec} is another useful file that has short summaries of all of the important code in the project.`;
    } else {
      assistantPromptInstructions += `
        2. ${fileTypes.aispec} should contain many short summaries of the functions, classes and data in the project code, but it is having an issue and may not be reliable. You should be extra cautious about incomplete architectural analysis.`;
    }

    if (projectsourceStatus === 'Complete' || projectsourceStatus === 'Processing' || projectsourceStatus === 'Idle') {
      assistantPromptInstructions += `
        3. ${fileTypes.projectsource} is the concatenation of all of the source code in the project.`;
    } else {
      assistantPromptInstructions += `
        3. ${fileTypes.projectsource} should contain all of the source code in the project, but it is having an issue and may not be reliable. You should be extra cautious about citing code from this file.`;
    }

    assistantPromptInstructions += `
        For all questions asked of you, use the ${fileTypes.blueprint} and ${fileTypes.aispec} files. Retrieve code snippets as needed from the concatenated code file ${fileTypes.projectsource}.

        If it is helpful you will be given additional details about how to answer specific types of questions when you go to answer them.
    `;

    return assistantPromptInstructions;

    // if we fail to build the smart/dynamic prompt, we still want to provide a working prompt - so we fall back to the basic prompt with a major warning
  } catch (error: any) {
    console.error(`Failed to build the smart/dynamic prompt for the assistant. Error: `, error.stack || error);
    console.warn(`Falling back to a basic prompt for the assistant with a major caution to user. The file information include is ${fileTypes?JSON.stringify(fileTypes):'unknown'}`);

    return `
    You are a software architecture assistant as well as a coding assistant named Sara.

    You are having trouble analyzing the project code to build a good understanding, but you hope to overcome these challenges soon.
    You should caution the user asking you questions about the reliability of your answers, and remind them that you are still researching their code and better answers will be available soon.

    You have access to the full codebase of a project in your files, including a file named ${fileTypes.aispec} that summarizes the code.

    Questions asked of you will be similiar to - but not exhaustive of - the bulleted list below:
    * Questions focused on understanding and trying to define more granular work-items for high-level project goals
    * Questions focused on trying to accomplish/complete a specific work-item that is associated with and required to complete a high-level project goal
    * Questions focused on code/coding about the project where answers ought to use the relevant frameworks, APIs, data structures, and other aspects of the existing code
    * Questions focused on software architecture and principals

    If someone asks a more specific coding question about the project, unless otherwise explicitly told not to, you give answers that use the relevant frameworks, APIs, data structures, and other aspects of the existing code.

    There are at least three files you have access to that will help you answer questions:
    1. ${fileTypes.blueprint} is a very short summary of the overall architecture of the project. It talks about what programming languages are used, major frameworks, and so forth.
    2. ${fileTypes.aispec} is another useful file that has short summaries of all of the important code in the project.
    3. ${fileTypes.projectsource} is the concatenation of all of the source code in the project.

    For all questions asked of you, use the ${fileTypes.blueprint} and ${fileTypes.aispec} files. Retrieve code snippets as needed from the concatenated code file ${fileTypes.projectsource}.

    If it is helpful you will be given additional details about how to answer specific types of questions when you go to answer them.`;
  }
}

const oaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function mapFileInfoToPromptAndIDs(
    fileInfos: ProjectDataReference[],
    boostProjectStatus?: BoostProjectStatus) {
  let fileTypes: FileTypes = { aispec: '', blueprint: '', projectsource: '' }
  fileInfos.map(({ name, type }) => {
    fileTypes[type as keyof FileTypes] = name
  })

  const prompt = getOpenAIAssistantInstructions(fileTypes, boostProjectStatus)

  const fileIDs = fileInfos.map(({ id }) => id)
  return { prompt, fileIDs }
}

export async function createAssistant(
  fileInfos: ProjectDataReference[],
  assistantMetadata: AssistantMetadata,
  boostProjectStatus?: BoostProjectStatus,
): Promise<Assistant> {
  const { prompt, fileIDs } = mapFileInfoToPromptAndIDs(fileInfos, boostProjectStatus)
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

export async function getAssistant(assistantId: string): Promise<Assistant> {
  return oaiClient.beta.assistants.retrieve(assistantId)
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
  boostProjectStatus?: BoostProjectStatus
): Promise<Assistant> {
  const { prompt, fileIDs } = mapFileInfoToPromptAndIDs(fileInfos, boostProjectStatus)

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
    return await updateAssistantPromptAndFiles(fileInfos, existingAssistant, undefined)
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
export const updateGlobalAssistantPrompt = async (
  promptFileInfos: PromptFileInfo[],
  projectStatus: BoostProjectStatus,
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

  const prompt = getOpenAIAssistantInstructions(identifiedPromptFileTypes, projectStatus)

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
