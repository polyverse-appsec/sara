import { stat } from 'fs'
import { ReactNode, useEffect } from 'react'

import { configAssistantForProject } from './../app/_actions/config-assistant-for-project'
import { createProjectOnBoost } from './../app/_actions/create-project-on-boost'
import { getFileInfoForProject } from './../app/_actions/get-file-info-for-repo'
import { useAppContext } from './../lib/hooks/app-context'
import { formatDateForLastSynchronizedAt } from './../lib/utils'

const useDataWatcher = () => {
  const {
    user,
    saraConfig: { projectConfig, repoConfig, orgConfig },
    setProjectConfig,
  } = useAppContext()

  useEffect(() => {
    const { project } = projectConfig
    const { repo } = repoConfig
    const { organization } = orgConfig

    // Do a bunch of narrowing and don't run if all of the Sara config isn't
    // fully prepared
    if (!project || !repo || !user || !organization) {
      console.debug(
        'Skpping AI update on repo change as Sara config not fully prepared yet',
      )

      return
    }

    const timeoutIds: NodeJS.Timeout[] = []

    const updateAIOnRepositoryChange = async () => {
      try {
        projectConfig.project = project
        projectConfig.status = 'CONFIGURING'
        projectConfig.statusInfo = 'Learning More About Your Project'
        projectConfig.errorInfo = null

        setProjectConfig(projectConfig)

        // We await this to ensure that any calls to the backend have data
        // references - whether they files have been processed or not. If
        // creation actually does happen this will take ~15 seconds. Anything
        // more should be considered a critical bug.
        await createProjectOnBoost(project.name, project.mainRepository, [])
        const fileInfos = await getFileInfoForProject(project, user)
        const assistant = await configAssistantForProject(
          project,
          fileInfos,
          user,
          organization,
        )

        const lastSynchronizedAt = new Date()

        projectConfig.project.lastSynchronizedAt = lastSynchronizedAt
        projectConfig.project.assistant = assistant
        projectConfig.status = 'CONFIGURED'
        projectConfig.statusInfo = `Synchronized Last: ${formatDateForLastSynchronizedAt(
          lastSynchronizedAt,
        )}`
        projectConfig.errorInfo = null

        setProjectConfig(projectConfig)
      } catch (err) {
        // Return the `project` on `projectConfig` to maintain the reference for
        // future iterations of this function
        projectConfig.project = project
        projectConfig.status = 'ERROR'
        projectConfig.statusInfo = ''
        projectConfig.errorInfo =
          'Error Synchronizing Sara For Project - Trying Again'
        setProjectConfig(projectConfig)

        const timeoutId = setTimeout(updateAIOnRepositoryChange, 2500)
        timeoutIds.push(timeoutId)
      }
    }

    updateAIOnRepositoryChange()

    return () => timeoutIds.forEach(clearTimeout)
  }, [projectConfig])
}

interface GlobalContextWatcherProps {
  children: ReactNode
}

export function GlobalContextWatcher({ children }: GlobalContextWatcherProps) {
  useDataWatcher() // This will invoke the data watching logic

  // Render your component (can be just a fragment if no UI is needed)
  return <div>{children}</div>
}
