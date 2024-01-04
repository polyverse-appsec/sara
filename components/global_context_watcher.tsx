import { useEffect, ReactNode, AppContext } from 'react'
import { useAppContext } from '@/lib/hooks/app-context'

const useDataWatcher = () => {
  const { selectedRepository } = useAppContext()

  useEffect(() => {
    // This effect will run whenever 'data' changes
    const doWorkBasedOnData = () => {
      console.log(
        'useDataWatcher: selectedRepository changed to: ',
        selectedRepository
      )
    }

    doWorkBasedOnData()
  }, [selectedRepository]) // Dependency array with 'data' to watch for its changes
}

interface GlobalContextWatcherProps {
  children: ReactNode
}

export function GlobalContextWatcher({ children }: GlobalContextWatcherProps) {
  useDataWatcher() // This will invoke the data watching logic

  // Render your component (can be just a fragment if no UI is needed)
  return <div>{children}</div>
}
