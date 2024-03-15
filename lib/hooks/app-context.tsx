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

  // To only be used to config the project. All individual pages ought to pull
  // the project details from the REST APIs based on the project ID they get in
  // their rendered route slugs
  projectIdForConfiguration: string | null
  setProjectIdForConfiguration: (projectId: string | null) => void
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

  const [projectIdForConfiguration, setProjectIdForConfiguration] = useState<
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
    projectIdForConfiguration,
    setProjectIdForConfiguration,
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

  // Ehhh... This is probably the wrong construct to piggyback on this logic
  // but will be good enough for our first pass through. This project config
  // logic is probably best suited for its own provider.
  useEffect(() => {
    let isMounted = true

    // 03/14/24: We saw our Vercel K/V usage spike between 03/10-03/13. We
    // introduced a lot of polling from the UI. This polling here was originally
    // set to run every 10 seconds but for now we are running it every 60
    // seconds once the projects health turns green. We will review the
    // architecture/approaches to satisfying UX moving forward.
    let configProjectFrequencyMilliseconds = 10000

    const configProject = async () => {
      if (!activeBillingOrg || !projectIdForConfiguration) {
        if (isMounted) {
          setTimeout(configProject, configProjectFrequencyMilliseconds)
        }

        return
      }

      try {
        // Start by just confing the project as we care about this request
        // not being short-circuited if the order of requests were different to
        // ensure that at least there is an attempt to config the project.
        const configRes = await fetch(
          `/api/projects/${projectIdForConfiguration}/config`,
          {
            method: 'POST',
          },
        )

        if (!configRes.ok) {
          const resErrText = await configRes.text()
          const errMsg = `Request configuring project '${projectIdForConfiguration}' failed because: ${resErrText}`

          console.debug(errMsg)
          throw new Error(errMsg)
        }

        // Now check the health of the project. If it is healthy then submit the
        // default chat question for the project if it hasn't been already
        const fetchProjectHealthRes = await fetch(
          `/api/projects/${projectIdForConfiguration}/health`,
        )

        if (!fetchProjectHealthRes.ok) {
          const resErrText = await fetchProjectHealthRes.text()
          const errMsg = `Request for projects '${projectIdForConfiguration}' health failed because: ${resErrText}`

          console.debug(errMsg)
          throw new Error(errMsg)
        }

        const projectHealth =
          (await fetchProjectHealthRes.json()) as ProjectHealth

        // Our behavior will pivot based on the health of the project.
        // Once we the project as 'HEALTHY' we will start re-running this
        // logic once every 60 seconds. If it isn't then we will re-run it
        // more frequently.
        if (projectHealth.readableValue === 'HEALTHY') {
          configProjectFrequencyMilliseconds = 60000
        } else {
          configProjectFrequencyMilliseconds = 10000
        }

        // If we are in an `UNHEALTHY` state we won't even consider creating
        // the default goal and chat even if one isn't created yet
        if (projectHealth.readableValue === 'UNHEALTHY') {
          console.debug(
            `Project '${projectIdForConfiguration}' health is '${projectHealth.readableValue}' in a configuration state of '${projectHealth.configurationState}' - skipping default goal/chat creation`,
          )

          if (isMounted) {
            setTimeout(configProject, configProjectFrequencyMilliseconds)
          }

          return
        }

        // We at least need to have vector data - any - attached to the LLM for
        // us to provide a chat experience. The configuration states that happen
        // before it aren't valid states when we are `PARTIALLY_HEALTHY`. Those
        // states are: `UNKNOWN`, `VECTOR_DATA_AVAILABLE`, and `LLM_CREATED`
        if (
          projectHealth.readableValue === 'PARTIALLY_HEALTHY' &&
          (projectHealth.configurationState === 'UNKNOWN' ||
            projectHealth.configurationState === 'VECTOR_DATA_AVAILABLE' ||
            projectHealth.configurationState === 'LLM_CREATED')
        ) {
          console.debug(
            `Project '${projectIdForConfiguration}' health is '${projectHealth.readableValue}' in a configuration state of '${projectHealth.configurationState}' - skipping default goal/chat creation`,
          )

          if (isMounted) {
            setTimeout(configProject, configProjectFrequencyMilliseconds)
          }

          return
        }

        // At this point our project is either healthy or partially healthy in
        // some configuration state that can provide some chat experience.
        // Create the default goal and chat now if needed.
        //
        // This is a lazy heuristic for determining if the default goal/chat has
        // been created for a project but just check to see if it has any goal
        // IDs associated with it. If not we will create the default goal. In
        // the future we can improve on this. Note this has the downside of
        // always creating a default goal if the user has deleted all of their
        // goals at any one point.
        const fetchProjectRes = await fetch(
          `/api/projects/${projectIdForConfiguration}`,
        )

        if (!fetchProjectRes.ok) {
          const resErrText = await fetchProjectRes.text()
          const errMsg = `Request for project '${projectIdForConfiguration}' details failed because: ${resErrText}`

          console.debug(errMsg)
          throw new Error(errMsg)
        }

        const project = (await fetchProjectRes.json()) as ProjectPartDeux

        // Create the default goal if we don't find any goal IDs associated with
        // the project
        if (project.goalIds.length === 0) {
          // Proceed with default goal and chat creation if the project doesn't
          // have any goal IDs associated with it...
          const goalBody = {
            orgId: activeBillingOrg.id,
            parentProjectId: projectIdForConfiguration,
            name: 'Learn More About Your Project',
            description:
              'Provide details that will help me learn about my project. This includes details about the code in my project as well as the software packages/libraries it consumes.',
          }

          const createDefeaultGoalRes = await fetch(`/api/goals`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(goalBody),
          })

          if (!createDefeaultGoalRes.ok) {
            const resErrText = await createDefeaultGoalRes.text()
            const errMsg = `Failed to POST default goal for project '${projectIdForConfiguration}' because: ${resErrText}`

            console.debug(errMsg)
            throw new Error(errMsg)
          }

          const defaultGoal =
            (await createDefeaultGoalRes.json()) as GoalPartDeux

          // Now create the chat for the default goal.
          const chatBody = {
            query: defaultGoal.description,
          }

          const createDefeaultGoalChatRes = await fetch(
            `/api/goals/${defaultGoal.id}/chats`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(chatBody),
            },
          )

          if (!createDefeaultGoalChatRes.ok) {
            const resErrText = await createDefeaultGoalChatRes.text()
            const errMsg = `Failed to POST chat for default goal for project '${projectIdForConfiguration}' because: ${resErrText}`

            console.debug(errMsg)
            throw new Error(errMsg)
          }
        }

        // Restart it all over again...
        if (isMounted) {
          setTimeout(configProject, configProjectFrequencyMilliseconds)
        }
      } catch (error) {
        console.debug(
          `Failed to config project '${projectIdForConfiguration}' because: ${error}`,
        )

        if (isMounted) {
          setTimeout(configProject, configProjectFrequencyMilliseconds)
        }
      }
    }

    configProject()

    return () => {
      isMounted = false
    }
  }, [activeBillingOrg, projectIdForConfiguration])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
