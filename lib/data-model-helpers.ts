import {
  PromptFileInfoType,
  PromptFileInfoTypeString,
} from './data-model-types'

export const isPromptFileInfoTypeString = (
  key: any,
): key is PromptFileInfoTypeString =>
  Object.values(PromptFileInfoType).includes(key)
