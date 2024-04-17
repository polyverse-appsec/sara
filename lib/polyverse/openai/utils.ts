import { type PromptFileInfo } from './../../../lib/data-model-types'

export interface PromptFileTypes {
  blueprint: string
  aispec: string
  projectsource: string
}

export const blueprintId = `"Architectural Blueprint Summary"`
export const aispecId = `"Code and Function Specifications"`
export const projectsourceId = `"Project Source Code"`
