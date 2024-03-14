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
  ProjectPartDeux,
  Repository,
  Task,
  User,
  type GoalPartDeux,
  type OrgPartDeux,
  type ProjectHealth,
} from '../data-model-types'
import { getOrCreateUserFromSession } from './../../app/_actions/get-or-create-user-from-session'

/**
 * The different states a `SaraConfigurable` can be in. At different points in
 * a users journey the app will kick off actions that will modify the states of
 * configurables. Other UX can monitor these states and then enable/disbale
 * functionality depending on those states.
 */
export type SaraConfigStatuses =
  | 'UNCONFIGURED'
  | 'CONFIGURING'
  | 'CONFIGURED'
  | 'ERROR'

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

export interface ProjectConfigurable extends SaraConfigurable {
  project: SaraProject | null
}

interface RepositoryConfigurable extends SaraConfigurable {
  repo: Repository | null
}

export interface SaraConfig {
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
  errorInfo: null,
})

const initialSaraConfig = (): SaraConfig => ({
  status: 'UNCONFIGURED',
  // TODO: Initialize to the initial step/state to be selected
  statusInfo: 'Select Organization',
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
  },
})

// TODO: Type the return value of this
const buildSaraConfigStateSetters = (
  saraConfig: SaraConfig,
  setSaraConfig: React.Dispatch<React.SetStateAction<SaraConfig>>,
): [
  (orgConfig: OrganizationConfigurable) => void,
  (projectConfig: ProjectConfigurable) => void,
  (repoConfig: RepositoryConfigurable) => void,
] => {
  const setOrgConfig = (orgConfig: OrganizationConfigurable): void => {
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
      statusInfo,
    }

    setSaraConfig(newSaraConfig)
  }

  const setProjectConfig = (projectConfig: ProjectConfigurable): void => {
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
      statusInfo,
    }

    setSaraConfig(newSaraConfig)
  }

  const setRepoConfig = (repoConfig: RepositoryConfigurable): void => {
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
      statusInfo,
    }

    setSaraConfig(newSaraConfig)
  }

  return [setOrgConfig, setProjectConfig, setRepoConfig]
}

export interface PrototypeContext {
  activeOrg: Organization | null
}

interface AppContextType {
  /////////////////////////////////////////////////////////////////////////////
  // Start Old App Context
  // 03/13/24: All of the app context between this block comment and the ending
  // one ought to be deleted once we cut over to the new UI workflows.
  /////////////////////////////////////////////////////////////////////////////
  user: User | null
  setUser: (user: User | null) => void

  selectedActiveChat: Chat | null
  setSelectedActiveChat: (chat: Chat | null) => void

  chatStreamLastFinishedAt: number | null
  setChatStreamLastFinishedAt: (generatedAt: number | null) => void

  saraConfig: SaraConfig
  setOrgConfig: (orgConfig: OrganizationConfigurable) => void
  setProjectConfig: (projectConfig: ProjectConfigurable) => void
  setRepoConfig: (repoConfig: RepositoryConfigurable) => void

  prototypeContext: PrototypeContext
  setPrototypeContext: (prototypeContext: PrototypeContext) => void

  /////////////////////////////////////////////////////////////////////////////
  // End Old App Context
  /////////////////////////////////////////////////////////////////////////////

  activeBillingOrg: OrgPartDeux | null
  setActiveBillingOrg: (org: OrgPartDeux) => void

  // To only be used to refresh the project. All individual pages ought to pull
  // the project details from the REST APIs based on the project ID they get in
  // their rendered route slugs
  setProjectIdForRefreshing: (projectId: string | null) => void
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
  const [selectedActiveChat, setSelectedActiveChat] = useState<Chat | null>(
    null,
  )
  const [chatStreamLastFinishedAt, setChatStreamLastFinishedAt] = useState<
    number | null
  >(null)
  const [selectedProjectRepositories, setSelectedProjectRepositories] =
    useState<Repository[] | null>(null)

  const [saraConfig, setSaraConfig] = useState<SaraConfig>(initialSaraConfig())
  const [setOrgConfig, setProjectConfig, setRepoConfig] =
    buildSaraConfigStateSetters(saraConfig, setSaraConfig)

  const [prototypeContext, setPrototypeContext] = useState<PrototypeContext>({
    activeOrg: null,
  })

  const [activeBillingOrg, setActiveBillingOrg] = useState<OrgPartDeux | null>(
    null,
  )

  const [projectIdForRefreshing, setProjectIdForRefreshing] = useState<
    string | null
  >(null)

  const value = {
    user,
    setUser,
    selectedProjectRepositories,
    setSelectedProjectRepositories,
    selectedActiveChat,
    setSelectedActiveChat,
    chatStreamLastFinishedAt,
    setChatStreamLastFinishedAt,
    saraConfig,
    setOrgConfig,
    setProjectConfig,
    setRepoConfig,
    prototypeContext,
    setPrototypeContext,
    activeBillingOrg,
    setActiveBillingOrg,
    projectIdForRefreshing,
    setProjectIdForRefreshing,
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

  // // Ehhh... This is probably the wrong construct to piggyback on this logic
  // // but will be good enough for our first pass through. This project refreshing
  // // logic is probably best suited for its own provider.
  // useEffect(() => {
  //   let isMounted = true
  //   const refreshProjectFrequencyMilliseconds = 10000

  //   const refreshProject = async () => {
  //     if (!activeBillingOrg || !projectIdForRefreshing) {
  //       if (isMounted) {
  //         setTimeout(refreshProject, refreshProjectFrequencyMilliseconds)
  //       }

  //       return
  //     }

  //     try {
  //       // Start by just refreshing the project as we care about this request
  //       // not being short-circuited if the order of requests were different to
  //       // ensure that at least there is an attempt to refresh the project.
  //       const refreshRes = await fetch(
  //         `/api/projects/${projectIdForRefreshing}/refresh`,
  //         {
  //           method: 'POST',
  //         },
  //       )

  //       if (!refreshRes.ok) {
  //         const resErrText = await refreshRes.text()
  //         const errMsg = `Request refreshing project '${projectIdForRefreshing}' failed because: ${resErrText}`

  //         console.debug(errMsg)
  //         throw new Error(errMsg)
  //       }

  //       // Now check the health of the project. If it is healthy then submit the
  //       // default chat question for the project if it hasn't been already
  //       const fetchProjectHealthRes = await fetch(
  //         `/api/projects/${projectIdForRefreshing}/health`,
  //       )

  //       if (!fetchProjectHealthRes.ok) {
  //         const resErrText = await fetchProjectHealthRes.text()
  //         const errMsg = `Request for projects '${projectIdForRefreshing}' health failed because: ${resErrText}`

  //         console.debug(errMsg)
  //         throw new Error(errMsg)
  //       }

  //       const projectHealth =
  //         (await fetchProjectHealthRes.json()) as ProjectHealth

  //       if (projectHealth.readableValue !== 'HEALTHY') {
  //         console.debug(
  //           `Project '${projectIdForRefreshing}' healths is '${projectHealth.readableValue}' - skipping default goal/chat creation`,
  //         )

  //         if (isMounted) {
  //           setTimeout(refreshProject, refreshProjectFrequencyMilliseconds)
  //         }

  //         return
  //       }

  //       // This is a lazy heuristic for determining if the default goal/chat has
  //       // been created for a project but just check to see if it has any goal
  //       // IDs associated with it. If not we will create the default goal. In
  //       // the future we can improve on this. Note this has the downside of
  //       // always creating a default goal if the user has deleted all of their
  //       // goals at any one point.
  //       const fetchProjectRes = await fetch(
  //         `/api/projects/${projectIdForRefreshing}`,
  //       )

  //       if (!fetchProjectRes.ok) {
  //         const resErrText = await fetchProjectRes.text()
  //         const errMsg = `Request for project '${projectIdForRefreshing}' details failed because: ${resErrText}`

  //         console.debug(errMsg)
  //         throw new Error(errMsg)
  //       }

  //       const project = (await fetchProjectRes.json()) as ProjectPartDeux

  //       // Create the default goal if we don't find any goal IDs associated with
  //       // the project
  //       if (project.goalIds.length === 0) {
  //         // Proceed with default goal and chat creation if the project doesn't
  //         // have any goal IDs associated with it...
  //         const goalBody = {
  //           orgId: activeBillingOrg.id,
  //           parentProjectId: projectIdForRefreshing,
  //           name: 'Learn More About Your Project',
  //           description:
  //             'Provide details that will help me learn about my project. This includes details about the code in my project as well as the software packages/libraries it consumes.',
  //         }

  //         const createDefeaultGoalRes = await fetch(`/api/goals`, {
  //           method: 'POST',
  //           headers: {
  //             'Content-Type': 'application/json',
  //           },
  //           body: JSON.stringify(goalBody),
  //         })

  //         if (!createDefeaultGoalRes.ok) {
  //           const resErrText = await createDefeaultGoalRes.text()
  //           const errMsg = `Failed to POST default goal for project '${projectIdForRefreshing}' because: ${resErrText}`

  //           console.debug(errMsg)
  //           throw new Error(errMsg)
  //         }

  //         const defaultGoal =
  //           (await createDefeaultGoalRes.json()) as GoalPartDeux

  //         // Now create the chat for the default goal.
  //         const chatBody = {
  //           query: defaultGoal.description,
  //         }

  //         const createDefeaultGoalChatRes = await fetch(
  //           `/api/goals/${defaultGoal.id}/chats`,
  //           {
  //             method: 'POST',
  //             headers: {
  //               'Content-Type': 'application/json',
  //             },
  //             body: JSON.stringify(chatBody),
  //           },
  //         )

  //         if (!createDefeaultGoalChatRes.ok) {
  //           const resErrText = await createDefeaultGoalChatRes.text()
  //           const errMsg = `Failed to POST chat for default goal for project '${projectIdForRefreshing}' because: ${resErrText}`

  //           console.debug(errMsg)
  //           throw new Error(errMsg)
  //         }
  //       }

  //       // Restart it all over again...
  //       if (isMounted) {
  //         setTimeout(refreshProject, refreshProjectFrequencyMilliseconds)
  //       }
  //     } catch (error) {
  //       console.debug(
  //         `Failed to refresh project '${projectIdForRefreshing}' because: ${error}`,
  //       )

  //       if (isMounted) {
  //         setTimeout(refreshProject, refreshProjectFrequencyMilliseconds)
  //       }
  //     }
  //   }

  //   refreshProject()

  //   return () => {
  //     isMounted = false
  //   }
  // }, [activeBillingOrg, projectIdForRefreshing])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
