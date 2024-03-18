import OpenAI from 'openai'
import { Assistant } from 'openai/resources/beta/assistants/assistants'

import packageInfo from '../../../package.json'
import {
  Project,
  ProjectDataReference,
  Repository,
  type PromptFileInfo,
  ProjectPartDeux,
} from '../../data-model-types'
import { BoostProjectStatus } from '../backend/get-boost-project-status'
import { isRecord } from '../typescript/helpers'
import {
  mapPromptFileInfosToPromptFileTypes,
  type PromptFileTypes,
} from './../../../lib/polyverse/openai/utils'
import { OPENAI_MODEL } from './constants'

export const ASSISTANT_METADATA_CREATOR = 'sara.frontend'

export const getVersion = () => {
  // get the version off the runtime package.json
  return packageInfo.version
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
  stage: string
}

function createAssistantName(metadata: AssistantMetadata): string {
  // remove spaces and special characters from project-id and create a simple underscore delimited
  // string to use as part of the assistant name
  const projectId = metadata.projectId.replace(/[^a-zA-Z0-9]/g, '_')
  const userName = metadata.userName.replace(/[^a-zA-Z0-9]/g, '_')
  return `${metadata.creator}-${metadata.version}-${metadata.stage}-${metadata.orgName}-${userName}-${projectId}`
}

// Note that this function uses the new type `PromptFileTypes` which we have
// designed as part of a data model/UI/Open AI logic refresh. Other functions
// in this file use the old `FileTypes` type. Once we have fully cut over to
// the new UI that consumes this new data model/Open AI logic  we ought to
// update the other functions to use the new type.
function getOpenAIAssistantInstructions(
  fileTypes: FileTypes | PromptFileTypes,
  project: ProjectPartDeux,
  projectStatus?: BoostProjectStatus,
): string {
  // This prompt was engineered to guide Sara on what she will be doing
  // overall when she is created as an OpenAI Assistant. When specific questions
  // are asked of her in a Thread and she is told to provide an answer to the
  // question by performing a Thread Run each Thread Run ought to override the
  // instructions if it will help Sara focus on the type of answer she ought to
  // provide.
  let assistantPromptInstructions = `You are a software architecture assistant as well as a coding assistant named Sara.
      `

  try {
    if (project.name) {
      assistantPromptInstructions += `
        You are advising a software engineer with the project named ${project.name}.`
    }

    if (project.description) {
      assistantPromptInstructions += ` The project description is: ${project.description}`
    }

    const aiSpecStatus = projectStatus?.resourcesState?.find(
      (resource) => resource[0] === 'aispec',
    )?.[1]

    const blueprintStatus = projectStatus?.resourcesState?.find(
      (resource) => resource[0] === 'blueprint',
    )?.[1]

    const projectsourceStatus = projectStatus?.resourcesState?.find(
      (resource) => resource[0] === 'projectsource',
    )?.[1]

    const blueprintId = `"Architectural Blueprint Summary"`
    const aispecId = `"Code and Function Specifications"`
    const projectsourceId = `"Project Source Code"`

    // pretty print the last sync date and time in local time zone (note last synchronized is a Unix time in seconds
    const lastSynchronizedProjectDataAt = projectStatus?.lastSynchronized
      ? new Date(projectStatus.lastSynchronized * 1000).toLocaleString()
      : ''

    if (projectStatus?.synchronized) {
      assistantPromptInstructions += `You have fully reviewed the project code and analyzed each file to the best of your abilities.`
    } else if (projectStatus?.activelyUpdating) {
      assistantPromptInstructions += `You are currently updating your understanding of the project code, and have not fully completed your analysis.`

      // TODO: This is somewhat incomplete and speculative since it doesn't track how many files have been already imported or analyzed

      const estimatedFilesToProcess = projectStatus?.possibleStagesRemaining
        ? projectStatus.possibleStagesRemaining
        : 0
      if (estimatedFilesToProcess > 1000) {
        assistantPromptInstructions += `You have a very incomplete and light understanding of the project code and haven't seen most of the code yet.`
      } else if (estimatedFilesToProcess > 100) {
        assistantPromptInstructions += `You have a basic understanding of the project code. You have seen many files, but lack a deep understanding of the project.`
      } else if (estimatedFilesToProcess > 10) {
        assistantPromptInstructions += `You have a good understanding of the project code. You have seen many files, and are close to a deep understanding of the project.`
      }

      const numberOfMinutesEstimatedBeforeSynchronization =
        projectStatus?.possibleStagesRemaining
          ? Math.ceil(projectStatus.possibleStagesRemaining / 10)
          : 0

      if (numberOfMinutesEstimatedBeforeSynchronization > 1) {
        assistantPromptInstructions += `You estimate that you will have a more complete understanding of the project in ${numberOfMinutesEstimatedBeforeSynchronization} minutes.`
      } else {
        assistantPromptInstructions += `You estimate that you will have a more complete understanding of the project in 1 minute.`
      }

      assistantPromptInstructions += `When you answer user questions, you should remind the user that you are still researching their code and better answers will be available soon.`

      // the project isn't fully synchronized, and there are no active updates at the moment - so we may be in an error state, or we've paused/given up on updating
      //    temporarily. The backend analysis may resume, but we should be extra cautious about incomplete analysis.
    } else {
      if (
        aiSpecStatus === 'Error' ||
        blueprintStatus === 'Error' ||
        projectsourceStatus === 'Error'
      ) {
        assistantPromptInstructions += `You are currently having some trouble analyzing the project code. You are investigating the issues impacting your analysis, and will try to resume again. But you should be extra cautious about incomplete analysis.`
      } else {
        assistantPromptInstructions += `You should be extra cautious about incomplete analysis and emphasize that caution to the user asking you questions.`
      }
    }

    if (lastSynchronizedProjectDataAt) {
      assistantPromptInstructions += `Your last successful deep analysis of the project code was at ${lastSynchronizedProjectDataAt}.`
    }

    if (
      projectsourceStatus === 'Complete' ||
      projectsourceStatus === 'Processing'
    ) {
      assistantPromptInstructions += `
        You have access to the full codebase of the project in your files in ${projectsourceId}.`

      // if the file is in error, we will leave it out of the prompt
    } else {
      assistantPromptInstructions += `
        You do not have complete access to the full codebase of the project yet. You are still analyzing the codebase and hope to have access to it soon.
        If you are asked questions about specific code, you should remind the user that you are still researching their code and better answers will be available soon.`
    }

    if (
      aiSpecStatus === 'Complete' ||
      aiSpecStatus === 'Processing' ||
      aiSpecStatus === 'Idle'
    ) {
      assistantPromptInstructions += `
        You have access to a data file ${aispecId} that summarizes all of the project code.`
    } else {
      assistantPromptInstructions += `
        You are having trouble analyzing the project code to build a good understanding, but you hope to overcome these challenges soon.
        If you are asked questions about structure, dependencies or the relationships between the code, you should remind the user that you are still researching their code and better answers will be available soon.`
    }

    assistantPromptInstructions += `
        Questions asked of you will be similiar to - but not exhaustive of - the bulleted list below:
        * Questions focused on understanding and trying to define more granular work-items for high-level project goals
        * Questions focused on trying to accomplish/complete a specific work-item that is associated with and required to complete a high-level project goal
        * Questions focused on code/coding about the project where answers ought to use the relevant frameworks, APIs, data structures, and other aspects of the existing code
        * Questions focused on software architecture and principals

        If someone asks a more specific coding question about the project, unless otherwise explicitly told not to, you give answers that use the relevant frameworks, APIs, data structures, and other aspects of the existing code.
    `

    assistantPromptInstructions += `
      There are at least three sets of data resources you have access to that will help you answer questions:`
    if (
      blueprintStatus === 'Complete' ||
      blueprintStatus === 'Processing' ||
      blueprintStatus === 'Idle'
    ) {
      assistantPromptInstructions += `
        1. ${blueprintId} ${fileTypes.blueprint} is a very short summary of the overall architecture of the project. It talks about what programming languages are used, major frameworks, and so forth.`
    } else {
      assistantPromptInstructions += `
        1. ${blueprintId} ${fileTypes.blueprint} should contain a short architectural summary of the project, but it is having an issue and may not be reliable. You should be extra cautious about incomplete analysis.`
    }

    if (
      aiSpecStatus === 'Complete' ||
      aiSpecStatus === 'Processing' ||
      aiSpecStatus === 'Idle'
    ) {
      assistantPromptInstructions += `
        2. ${aispecId} ${fileTypes.aispec} is another useful file that has short summaries of all of the important code in the project.`
    } else {
      assistantPromptInstructions += `
        2. ${aispecId} ${fileTypes.aispec} should contain many short summaries of the functions, classes and data in the project code, but it is having an issue and may not be reliable. You should be extra cautious about incomplete architectural analysis.`
    }

    if (
      projectsourceStatus === 'Complete' ||
      projectsourceStatus === 'Processing' ||
      projectsourceStatus === 'Idle'
    ) {
      assistantPromptInstructions += `
        3. ${projectsourceId} ${fileTypes.projectsource} is the concatenation of all of the source code in the project.`
    } else {
      assistantPromptInstructions += `
        3. ${projectsourceId} is not yet available. You should be extra cautious about citing code from this file.`
    }

    assistantPromptInstructions += `
        For all questions asked of you, use the contents of ${blueprintId} and ${aispecId} files.`
    if (
      projectsourceStatus === 'Complete' ||
      projectsourceStatus === 'Processing' ||
      projectsourceStatus === 'Idle'
    ) {
      assistantPromptInstructions += ` Retrieve code snippets as needed from the concatenated code in the file ${projectsourceId}.`
    } else {
      assistantPromptInstructions += ` You should be extra cautious about citing code from ${projectsourceId} since it isn't fully available yet.`
    }

    assistantPromptInstructions += `
        When answering questions, do not mention these specific resource ids to the user: ${fileTypes.blueprint}, ${fileTypes.aispec}, and ${fileTypes.projectsource}. These are dynamically generated and change frequently as you answer questions. Instead, refer to the resources by their descriptive names: ${blueprintId}, ${aispecId}, and ${projectsourceId}.

        If it is helpful you will be given additional details about how to answer specific types of questions when you go to answer them.
    `

    return assistantPromptInstructions

    // if we fail to build the smart/dynamic prompt, we still want to provide a working prompt - so we fall back to the basic prompt with a major warning
  } catch (error: any) {
    console.error(
      `Failed to build the smart/dynamic prompt for the assistant. Error: `,
      error.stack || error,
    )
    console.warn(
      `Falling back to a basic prompt for the assistant with a major caution to user. The file information include is ${
        fileTypes ? JSON.stringify(fileTypes) : 'unknown'
      }`,
    )

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

    If it is helpful you will be given additional details about how to answer specific types of questions when you go to answer them.`
  }
}

const oaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Note that the parameter `invalidProject` is - as the name implies - invalid.
// We pass in this parameter which has data values which aren't correct as this
// method ultimately will get a prompt for the assistant that relies on the new
// data model types. Since this method is used in the old UI/actions based UX
// and doesn't use the new data model types we just pass something to get this
// to compile while trying to maintain two code paths.
function mapProjectDetailsToPrompt(
  fileInfos: ProjectDataReference[],
  invalidProject: ProjectPartDeux,
  boostProjectStatus?: BoostProjectStatus,
) {
  let fileTypes: FileTypes = { aispec: '', blueprint: '', projectsource: '' }
  fileInfos.map(({ name, type }) => {
    fileTypes[type as keyof FileTypes] = name
  })

  const prompt = getOpenAIAssistantInstructions(
    fileTypes,
    invalidProject,
    boostProjectStatus)

  const fileIDs = fileInfos.map(({ id }) => id)
  return { prompt, fileIDs }
}

export async function createAssistant(
  fileInfos: ProjectDataReference[],
  assistantMetadata: AssistantMetadata,
  project: ProjectPartDeux,
  boostProjectStatus?: BoostProjectStatus,
): Promise<Assistant> {

  const promptFileTypes: FileTypes = { aispec: '', blueprint: '', projectsource: '' }

  fileInfos.map(({ name, type }) => {
    promptFileTypes[type as keyof FileTypes] = name
  })

  const prompt = getOpenAIAssistantInstructions(promptFileTypes, project, boostProjectStatus)

  const fileIDs = fileInfos.map(({ id }) => id)
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
  const foundMatchedAssistant = assistants?.data?.find(
    ({ metadata: retrievedMetadata }) =>
      isRecord(retrievedMetadata) &&
      retrievedMetadata.projectId === metadata.projectId &&
      retrievedMetadata.creator === ASSISTANT_METADATA_CREATOR &&
      retrievedMetadata.userName === metadata.userName &&
      retrievedMetadata.orgName === metadata.orgName &&
      retrievedMetadata.stage === metadata.stage,
    // We can do version upgrades (e.g. if a major or minor Sara version comes out
    //   we can fail the match on a version compare and then create a new assistant
    //   with the new version of Sara)
  )

  if (!foundMatchedAssistant) {
    console.debug(
      `Failed to find an assistant when searching for one using the following metadata: ${JSON.stringify(
        metadata,
      )}`,
    )
    return undefined
  }

  return foundMatchedAssistant
}

export async function getAssistant(assistantId: string): Promise<Assistant> {
  return oaiClient.beta.assistants.retrieve(assistantId)
}

// Note that the parameter `invalidProject` is - as the name implies - invalid.
// We pass in this parameter which has data values which aren't correct as this
// method ultimately will get a prompt for the assistant that relies on the new
// data model types. Since this method is used in the old UI/actions based UX
// and doesn't use the new data model types we just pass something to get this
// to compile while trying to maintain two code paths.
export async function updateAssistantPromptAndFiles(
  fileInfos: ProjectDataReference[],
  { id }: { id: string },
  invalidProject: ProjectPartDeux,
  boostProjectStatus?: BoostProjectStatus,
): Promise<Assistant> {

  const { prompt, fileIDs } = mapProjectDetailsToPrompt(
    fileInfos,
    invalidProject,
    boostProjectStatus,
  )

  return await oaiClient.beta.assistants.update(id, {
    file_ids: fileIDs,
    instructions: prompt,
  })
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
  assistantMetadata: AssistantMetadata,
  project: ProjectPartDeux,
  projectStatus: BoostProjectStatus,
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

  const identifiedPromptFileTypes =
    mapPromptFileInfosToPromptFileTypes(promptFileInfos)

  const prompt = getOpenAIAssistantInstructions(
    identifiedPromptFileTypes,
    project,
    projectStatus,
  )

  const fileIDs = promptFileInfos.map(({ id }) => id)

  return oaiClient.beta.assistants.update(assistant.id, {
    file_ids: fileIDs,
    instructions: prompt,
    tools: [
      { type: 'code_interpreter' },
      { type: 'retrieval' },
    ],
  })
}
