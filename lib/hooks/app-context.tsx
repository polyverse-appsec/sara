'use client'

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

import {
  type Goal,
  type Org,
  type Project,
  type ProjectHealth,
} from '../data-model-types'
import {
  createResource,
  createResourceNoResponseBody,
  createResourceWithoutRequestBody,
  getResource,
} from './../../app/saraClient'

interface ActiveProjectDetails {
  id: string
  project: Project
  health: ProjectHealth
}

interface ActiveWorkspaceDetails {
  goalId: string | null
  taskId: string | null
}

interface AppContextType {
  activeBillingOrg: Org | null
  setActiveBillingOrg: (org: Org) => void

  // Details for the most recently selected project
  activeProjectDetails: ActiveProjectDetails | null

  // To only be used to config the project. All individual pages ought to pull
  // the project details from the REST APIs based on the project ID they get in
  // their rendered route slugs
  projectIdForConfiguration: string | null
  setProjectIdForConfiguration: (projectId: string | null) => void

  activeWorkspaceDetails: ActiveWorkspaceDetails | null

  setActiveGoalId: (goalId: string | null) => void
  setActiveTaskId: (taskId: string, goalId: string) => void
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
  const [activeBillingOrg, setActiveBillingOrg] = useState<Org | null>(null)

  const [activeProjectDetails, setActiveProjectDetails] =
    useState<ActiveProjectDetails | null>(null)

  const [projectIdForConfiguration, setProjectIdForConfiguration] = useState<
    string | null
  >(null)

  const [activeWorkspaceDetails, setActiveWorkspaceDetails] =
    useState<ActiveWorkspaceDetails | null>(null)

  const setActiveGoalId = (goalId: string | null) => {
    const newActiveWorkspaceDetails: ActiveWorkspaceDetails = {
      goalId,
      taskId: null,
    }

    setActiveWorkspaceDetails(newActiveWorkspaceDetails)
  }

  const setActiveTaskId = (taskId: string, goalId: string) => {
    const newActiveWorkspaceDetails: ActiveWorkspaceDetails = {
      goalId,
      taskId,
    }

    setActiveWorkspaceDetails(newActiveWorkspaceDetails)
  }

  const value = {
    activeBillingOrg,
    setActiveBillingOrg,
    activeProjectDetails,
    projectIdForConfiguration,
    setProjectIdForConfiguration,
    activeWorkspaceDetails,
    setActiveGoalId,
    setActiveTaskId,
  }

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
    let configProjectFrequencyMilliseconds = 5000

    const configProject = async () => {
      if (!activeBillingOrg || !projectIdForConfiguration) {
        if (isMounted) {
          setTimeout(configProject, configProjectFrequencyMilliseconds)
        }

        return
      }

      try {
        const project = await getResource<Project>(
          `/projects/${projectIdForConfiguration}`,
          `Failed to get project data for '${projectIdForConfiguration}'`,
        )

        // Start by just configuring the project as we care about this request
        // not being short-circuited if the order of requests were different to
        // ensure that at least there is an attempt to config the project.
        await createResourceWithoutRequestBody(
          `/projects/${projectIdForConfiguration}/config`,
          `Failed to configure project '${projectIdForConfiguration}'`,
        )

        // Now check the health of the project. If it is healthy then submit the
        // default chat question for the project if it hasn't been already
        const projectHealth = await getResource<ProjectHealth>(
          `/projects/${projectIdForConfiguration}/health`,
          `Failed to get project health for '${projectIdForConfiguration}'`,
        )

        // Make sure to update our app wide details about the project we are
        // actively providing details for as well
        const newActiveProjectDetails: ActiveProjectDetails = {
          id: projectIdForConfiguration,
          project,
          health: projectHealth,
        }

        setActiveProjectDetails(newActiveProjectDetails)

        // Our behavior will pivot based on the health of the project.
        // Once we see the project as 'HEALTHY' we will start re-running this
        // logic once every 60 seconds. If it isn't then we will re-run it
        // more frequently.
        if (projectHealth.readableValue === 'HEALTHY') {
          configProjectFrequencyMilliseconds = 60000
        } else {
          configProjectFrequencyMilliseconds = 5000
        }
      } catch (error) {
        console.debug(
          `Failed to config project '${projectIdForConfiguration}' because: ${error}`,
        )

        // Blank out the details of our active project if we failed to collect
        // them
        setActiveProjectDetails(null)
      }

      // Restart it all over again...
      if (isMounted) {
        setTimeout(configProject, configProjectFrequencyMilliseconds)
      }
    }

    configProject()

    return () => {
      isMounted = false
      setActiveProjectDetails(null)
    }
  }, [activeBillingOrg, projectIdForConfiguration])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
