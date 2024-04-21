// Copied from the Boost Node service codebase
export enum BoostProjectStatus {
  Unknown = 'Unknown', // project not found
  OutOfDateProjectData = 'Out of Date Project Data', // project data out of date with source (e.g. newer source)
  ResourcesMissing = 'Resources Missing', // project uris found, but not resources
  // ResourcesOutOfDate = 'Resources Out of Date',        // Resources out of date with source (e.g. newer source)
  ResourcesIncomplete = 'Resources Incomplete', // resources found, but not completely generated
  ResourcesInError = 'Resources In Error', // resources found, but generators in error state
  ResourcesGenerating = 'Resources Generating', // resources missing or incomplete, but still being generated
  ResourcesNotSynchronized = 'Resources Not Synchronized', // resources completely generated, but not synchronized to OpenAI
  AIResourcesOutOfDate = 'AI Data Out of Date', // resources synchronized to OpenAI, but newer resources available
  Synchronized = 'Fully Synchronized', // All current resources completely synchronized to OpenAI
}

export interface ProjectAssistantInfo {
  assistantId: string

  matchedResources: any[]

  synchronized: boolean
}

export interface ResourceSourceState {
  syncTime?: number
  syncHash?: string
}

export enum DiscoveryTrigger {
  ProjectUpdate = 'ProjectCreation',
  UserManual = 'UserManual',
  AutomaticGrooming = 'AutomaticGrooming',
}

// Copied from the Boost Node service codebase
export interface BoostProjectStatusState {
  status: BoostProjectStatus
  synchronized?: boolean
  activelyUpdating?: boolean
  resourcesState?: any[]
  possibleStagesRemaining?: number
  processedStages?: number
  childResources?: number
  details?: string
  lastSynchronized?: number
  lastUpdated: number
  lastDiscoveryTrigger?: DiscoveryTrigger
  lastDiscoveryLaunch?: number
  assistant?: ProjectAssistantInfo
  sourceDataStatus?: ResourceSourceState[]
}
