import { useEffect, ReactNode } from 'react'
import { useAppContext } from '@/lib/hooks/app-context'
import {
  getOrCreateAssistantForRepo,
  tickleProjectFromRepoChange
} from '@/app/actions'

const useDataWatcher = () => {
  const {
    selectedProject: selectedRepository,
    setSelectedProject: setSelectedRepository
  } = useAppContext()

  useEffect(() => {
    // This effect will run whenever 'data' changes
    async function updateAIOnRepositoryChange() {
      if (selectedRepository) {
        tickleProjectFromRepoChange(selectedRepository)

        if (!selectedRepository.assistant) {
          const assistant =
            await getOrCreateAssistantForRepo(selectedRepository)
          if (assistant) {
            selectedRepository.assistant = assistant
            setSelectedRepository(selectedRepository)
          }
        }
      }
    }
    updateAIOnRepositoryChange()
  }, [selectedRepository, setSelectedRepository]) // Dependency array with 'data' to watch for its changes
}

interface GlobalContextWatcherProps {
  children: ReactNode
}

export function GlobalContextWatcher({ children }: GlobalContextWatcherProps) {
  useDataWatcher() // This will invoke the data watching logic

  // Render your component (can be just a fragment if no UI is needed)
  return <div>{children}</div>
}
