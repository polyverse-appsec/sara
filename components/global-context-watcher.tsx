import { ReactNode, useEffect } from 'react'

import { useAppContext } from './../lib/hooks/app-context'
import {
  getOrCreateAssistantForProject,
  tickleReposForProjectChange,
} from './../app/actions'

const useDataWatcher = () => {
  const {
    selectedProject,
    setSelectedProject,
    saraConfig: { projectConfig, repoConfig },
    setProjectConfig
  } = useAppContext()

  // TODO: Come back and complete this
  // TODO: Can I break up this useEffect into separate ones?
  // TODO: Can I update the dependency array with the types we are looking at
  // TODO: Add try/catch
  useEffect(() => {
    // This effect will run whenever 'data' changes
    async function updateAIOnRepositoryChange() {
      const { status, project } = projectConfig
      const { repo } = repoConfig

      if (status === 'CONFIGURED') {
          // TODO: Try catch this logic with status changes if error
          // We await this to ensure that any calls to the backend have data
          // references - whether they files have been processed or not.

          // TODO: Fairly certain Aaron sus'ed out a bug. We need to use the original app context for now
          // until we see this on the project type
          await tickleReposForProjectChange(repo ? [repo] : [])
      }

      if (project && !project.assistant) {
        // TODO: Add a state change to show we are configuring
        projectConfig.project = project
        projectConfig.status = 'CONFIGURING'
        projectConfig.statusInfo = 'Configuring Sara For Project'
        projectConfig.errorInfo = null

        setProjectConfig(projectConfig)

        // TODO: Fairly certain Aaron sus'ed out a bug. We need to use the original app context for now
        // until we see this on the project type
        const assistant = await getOrCreateAssistantForProject(
          project,
          repo ? [repo] : [],
        )

        if (assistant) {
          projectConfig.project.assistant = assistant
          projectConfig.status = 'CONFIGURED'
          // TODO: This is referenced somewhere so we probably want to move all of these 'status info' to a type for typechecking
          projectConfig.statusInfo = 'Sara Configured For Project'
          projectConfig.errorInfo = null

          setProjectConfig(projectConfig)
        }

        // TODO: Set project
        // TODO: Set status
        // TODO: Try catch this logic with status changes if error
      }
    }
    updateAIOnRepositoryChange()
  }, [
    projectConfig,
    repoConfig
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
