import { ReactNode, useEffect } from 'react'

import { useAppContext } from '@/lib/hooks/app-context'
import {
  getOrCreateAssistantForProject,
  tickleReposForProjectChange,
} from '@/app/actions'

const useDataWatcher = () => {
  const {
    selectedProjectRepositories,
    setSelectedProjectRepositories,
    selectedProject,
    setSelectedProject,
    saraConfig: { projectConfig },
    setProjectConfig
  } = useAppContext()

  // TODO: Come back and complete this
  // TODO: Can I break up this useEffect into separate ones?
  // TODO: Can I update the dependency array with the types we are looking at
  useEffect(() => {
    // This effect will run whenever 'data' changes
    async function updateAIOnRepositoryChange() {
      console.log(`GlobalContextWatcher#useDataWatcher#updateAIOnRepositoryChange`)
      const { status, project } = projectConfig

      if (status === 'CONFIGURED') {
        console.log(`GlobalContextWatcher#useDataWatcher#updateAIOnRepositoryChange - CONFIGURED`)
          // TODO: Try catch this logic with status changes if error
          // We await this to ensure that any calls to the backend have data
          // references - whether they files have been processed or not.
          await tickleReposForProjectChange(project?.selectedProjectRepositories ?? [])
      }

      // if (selectedProject) {
      //   // We await this to ensure that any calls to the backend have data
      //   // references - whether they files have been processed or not.
      //   await tickleReposForProjectChange(selectedProjectRepositories ?? [])
      // }

      if (project && !project.assistant) {
        console.log(`GlobalContextWatcher#useDataWatcher#updateAIOnRepositoryChange - get or Create assistant`)
        // TODO: Add a state change to show we are configuring
        projectConfig.project = project
        projectConfig.status = 'CONFIGURING'
        projectConfig.statusInfo = 'Configuring Sara For Project'
        projectConfig.errorInfo = null

        setProjectConfig(projectConfig)

        const assistant = await getOrCreateAssistantForProject(
          project,
          project?.selectedProjectRepositories ?? [],
        )

        project.assistant = assistant

        projectConfig.project = project
        projectConfig.status = 'CONFIGURED'
        // TODO: This is referenced somewhere so we probably want to move all of these 'status info' to a type for typechecking
        projectConfig.statusInfo = 'Sara Configured For Project'
        projectConfig.errorInfo = null

        setProjectConfig(projectConfig)

        // TODO: Start here and hook up the new state setters with the status and make sure we save the existing code for now to get things working - or maybe not

        // TODO: Set project
        // TODO: Set status
        // TODO: Try catch this logic with status changes if error
      }

      if (selectedProject && !selectedProject.assistant) {
        const assistant = await getOrCreateAssistantForProject(
          selectedProject,
          selectedProjectRepositories ?? [],
        )

        if (assistant) {
          selectedProject.assistant = assistant

          // We only update the selected project again in the event that the
          // assistant was retrieved/created
          setSelectedProject(selectedProject)
        }
      }
    }
    updateAIOnRepositoryChange()
  }, [
    selectedProject,
    setSelectedProject,
    selectedProjectRepositories,
    setSelectedProjectRepositories,
  ]) // Dependency array with 'data' to watch for its changes
}

interface GlobalContextWatcherProps {
  children: ReactNode
}

export function GlobalContextWatcher({ children }: GlobalContextWatcherProps) {
  useDataWatcher() // This will invoke the data watching logic

  // Render your component (can be just a fragment if no UI is needed)
  return <div>{children}</div>
}
