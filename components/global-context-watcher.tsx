import { ReactNode, useEffect } from 'react'

import { useAppContext } from '@/lib/hooks/app-context'
import {
  getOrCreateAssistantForProject,
  tickleProjectFromProjectChange,
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
        tickleProjectFromProjectChange(
          selectedProject,
          selectedProjectRepositories ?? [],
        )

        if (!selectedProject.assistant) {
          const assistant = await getOrCreateAssistantForProject(
            selectedProject,
            selectedProjectRepositories ?? [],
          )
          if (assistant) {
            selectedProject.assistant = assistant
            setSelectedProject(selectedProject)
          }
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
