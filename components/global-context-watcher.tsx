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
  } = useAppContext()

  useEffect(() => {
    // This effect will run whenever 'data' changes
    async function updateAIOnRepositoryChange() {
      if (selectedProject) {
        // We await this to ensure that any calls to the backend have data
        // references - whether they files have been processed or not.
        await tickleReposForProjectChange(selectedProjectRepositories ?? [])
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
