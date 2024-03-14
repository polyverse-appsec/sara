import { type PromptFileInfo } from './../../../lib/data-model-types'

export interface PromptFileTypes {
  blueprint: string
  aispec: string
  projectsource: string
}

export const mapPromptFileInfosToPromptFileTypes = (
  promptFileInfos: PromptFileInfo[],
): PromptFileTypes => {
  let identifiedPromptFileTypes: PromptFileTypes = {
    aispec: '',
    blueprint: '',
    projectsource: '',
  }

  promptFileInfos.map(({ name, type }) => {
    identifiedPromptFileTypes[type as keyof PromptFileTypes] = name
  })

  return identifiedPromptFileTypes
}
