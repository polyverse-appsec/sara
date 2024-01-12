import { useEffect, ReactNode } from 'react'
import { useAppContext } from '@/lib/hooks/app-context'
import {
  getOrCreateAssistantForRepo,
  tickleProjectFromRepoChange
} from '@/app/actions'

const useDataWatcher = () => {
  const { selectedRepository, setSelectedRepository } = useAppContext()

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
  }, [selectedRepository]) // Dependency array with 'data' to watch for its changes

  // TODO: is this dependency array the problem with `setSelectedRepository` provided?
}

interface GlobalContextWatcherProps {
  children: ReactNode
}

export function GlobalContextWatcher({ children }: GlobalContextWatcherProps) {
  useDataWatcher() // This will invoke the data watching logic

  // Render your component (can be just a fragment if no UI is needed)
  return <div>{children}</div>
}
