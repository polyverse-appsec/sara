'use client'

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useSession } from 'next-auth/react'

import {
  Chat,
  Organization,
  Project,
  Repository,
  Task,
  User,
} from '../data-model-types'
import { getOrCreateUserFromSession } from './../../app/actions'

/**
 * The different states a `SaraConfigurable` can be in. At different points in
 * a users journey the app will kick off actions that will modify the states of
 * configurables. Other UX can monitor these states and then enable/disbale
 * functionality depending on those states.
 */
export type SaraConfigStatuses = 'UNCONFIGURED' | 'CONFIGURING' | 'CONFIGURED' | 'ERROR'

// TODO: Is this needed?
/**
 * These are the different states that our configuration can be in
 */
export type SaraConfigStates = 'AWAITING_CONFIG_ORG'

/**
 * Describes the shape of a specific type of configuration that Sara is reliant
 * on. For example having an organization selected or having an OpenAI assistant
 * configured.
 */
interface SaraConfigurable {
  status: SaraConfigStatuses
  statusInfo: string | null
  /**
   * For debugging purposes to understand who configured this last
   */
  // lastConfiguredBy: string | null
  // lastConfiguredAt: number | null
  errorInfo: string | null
}

export interface SaraOrganization extends Organization {
  repositoriesById: Record<string, Repository> | null
}

// TODO: Can I make generic types of these interfaces?
interface OrganizationConfigurable extends SaraConfigurable {
  organization: SaraOrganization | null
}

/**
 * We extend our data model to gain access to instances of the repositories we
 * have queried for
 */
export interface SaraProject extends Project {
  referenceRepositoriesById: Record<string, Repository> | null

  // TODO: Can I make this property and the referenceRepositories private and then just provide methods to them?
}

interface ProjectConfigurable extends SaraConfigurable {
  project: SaraProject | null
}

interface RepositoryConfigurable extends SaraConfigurable {
  repo: Repository | null
}

interface SaraConfig {
  /**
   * Top-level status of the configuration of the app
   */
  status: SaraConfigStatuses

  /**
   * Top-level status information surrounding the configuration of the app
   */
  statusInfo: string | null

  /**
   * Top-level information surrounding any errors during the configuration of
   * the app
   */
  errorInfo: string | null

  orgConfig: OrganizationConfigurable
  projectConfig: ProjectConfigurable
  repoConfig: RepositoryConfigurable

  // TODO: Need dispatchers for individual configurables to set their status and errors but also which sets the top-level one
  // TODO: Need a top-level error
  // TODO: Need a top-level status
  // TODO: Need an awaiting action status string top-level
  // TODO: Should the awaitin action string also exist on the configurables?
}

const createInitializedConfigurable = (): SaraConfigurable => ({
  status: 'UNCONFIGURED',
  statusInfo: '',
  errorInfo: null
})

const initialSaraConfig = (): SaraConfig => ({
  status: 'UNCONFIGURED',
  // TODO: Initialize to the initial step/state to be selected
  statusInfo: 'Select Organiztion',
  errorInfo: null,
  orgConfig: {
    ...createInitializedConfigurable(),
    organization: null,
  },
  projectConfig: {
    ...createInitializedConfigurable(),
    project: null,
  },
  repoConfig: {
    ...createInitializedConfigurable(),
    repo: null,
  }
})

// TODO: Type the return value of this
const buildSaraConfigStateSetters = (saraConfig: SaraConfig, setSaraConfig: React.Dispatch<React.SetStateAction<SaraConfig>>): [
  (orgConfig: OrganizationConfigurable) => void,
  (projectConfig: ProjectConfigurable) => void,
  (repoConfig: RepositoryConfigurable) => void
] => {
  // TODO: Type the return value of this
  const setOrgConfig = (orgConfig: OrganizationConfigurable) => {
    // Make sure that we copy over properties to a new object so React won't see
    // the same object reference. This is important for triggering re-renders as
    // well as the `useEffect` method that may have a dependency array on some
    // of these objects.
    const newOrgConfig = { ...orgConfig }
    const { status, errorInfo, statusInfo } = newOrgConfig

    const newSaraConfig: SaraConfig = {
      ...saraConfig,
      // Copy over the new org config
      orgConfig: newOrgConfig,
      // Update the top-level info
      status,
      errorInfo,
      statusInfo
    }

    setSaraConfig(newSaraConfig)
  }

  // TODO: Type the return value of this
  const setProjectConfig = (projectConfig: ProjectConfigurable) => {
    // Make sure that we copy over properties to a new object so React won't see
    // the same object reference. This is important for triggering re-renders as
    // well as the `useEffect` method that may have a dependency array on some
    // of these objects.
    const newProjectConfig = { ...projectConfig }
    const { status, errorInfo, statusInfo } = newProjectConfig

    const newSaraConfig: SaraConfig = {
      ...saraConfig,
      // Copy over the new project config
      projectConfig: newProjectConfig,
      // Update the top-level info
      status,
      errorInfo,
      statusInfo
    }

    setSaraConfig(newSaraConfig)
  }

  // TODO: Type the return value of this
  const setRepoConfig = (repoConfig: RepositoryConfigurable) => {
    // Make sure that we copy over properties to a new object so React won't see
    // the same object reference. This is important for triggering re-renders as
    // well as the `useEffect` method that may have a dependency array on some
    // of these objects.
    const newRepoConfig = { ...repoConfig }
    const { status, errorInfo, statusInfo } = newRepoConfig

    const newSaraConfig: SaraConfig = {
      ...saraConfig,
      // Copy over the new project config
      repoConfig: newRepoConfig,
      // Update the top-level info
      status,
      errorInfo,
      statusInfo
    }

    setSaraConfig(newSaraConfig)
  }

  return [setOrgConfig, setProjectConfig, setRepoConfig]
}

interface AppContextType {
  user: User | null
  setUser: (user: User | null) => void

  selectedOrganization: Organization | null
  setSelectedOrganization: (organization: Organization | null) => void

  selectedProject: Project | null
  setSelectedProject: (project: Project | null) => void

  selectedActiveTask: Task | null
  setSelectedActiveTask: (task: Task | null) => void

  selectedActiveChat: Chat | null
  setSelectedActiveChat: (chat: Chat | null) => void

  chatStreamLastFinishedAt: number | null
  setChatStreamLastFinishedAt: (generatedAt: number | null) => void

  saraConfig: SaraConfig
  setOrgConfig: (orgConfig: OrganizationConfigurable) => void
  setProjectConfig: (projectConfig: ProjectConfigurable) => void
  setRepoConfig: (repoConfig: RepositoryConfigurable) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function useAppContext() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useAppContext must be used within a AppProvider')
  }

  return context
}

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedActiveTask, setSelectedActiveTask] = useState<Task | null>(
    null,
  )
  const [selectedActiveChat, setSelectedActiveChat] = useState<Chat | null>(
    null,
  )
  const [chatStreamLastFinishedAt, setChatStreamLastFinishedAt] = useState<
    number | null
  >(null)
  const [selectedProjectRepositories, setSelectedProjectRepositories] =
    useState<Repository[] | null>(null)

  const [saraConfig, setSaraConfig] = useState<SaraConfig>(initialSaraConfig())
  const [setOrgConfig, setProjectConfig, setRepoConfig] = buildSaraConfigStateSetters(saraConfig, setSaraConfig)

  const value = {
    user,
    setUser,
    selectedOrganization,
    setSelectedOrganization,
    selectedProject,
    setSelectedProject,
    selectedProjectRepositories,
    setSelectedProjectRepositories,
    selectedActiveTask,
    setSelectedActiveTask,
    selectedActiveChat,
    setSelectedActiveChat,
    chatStreamLastFinishedAt,
    setChatStreamLastFinishedAt,
    saraConfig,
    setOrgConfig,
    setProjectConfig,
    setRepoConfig
  }

  const { data: session } = useSession()

  useEffect(() => {
    const fetchUser = async () => {
      if (session) {
        try {
          const user = await getOrCreateUserFromSession(session)
          setUser(user) // Set the user in context
          // You can also set other states here based on the returned user data
        } catch (error) {
          console.error('Error fetching user:', error)
          // Handle errors appropriately
        }
      } else {
        setUser(null) // Reset user in context if session is not available
      }
    }

    fetchUser()
  }, [session])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
