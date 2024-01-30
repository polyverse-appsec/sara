import { ReactNode, useEffect } from 'react'

import { useAppContext } from './../lib/hooks/app-context'
import {
  getOrCreateAssistantForProject,
  tickleReposForProjectChange,
} from './../app/actions'

const useDataWatcher = () => {
  const {
    saraConfig: { projectConfig, repoConfig },
    setProjectConfig
  } = useAppContext()

  useEffect(() => {
    // This effect will run whenever 'data' changes
    async function updateAIOnRepositoryChange() {
      // TODO: Does this method requiring projectConfig and repoConfig dictate that we should just combine repoConfig into the projectConfig?
      // Looking at <GitHubSelect> we see that on repo change both the project and the repo get configured. See also our call
      // to `getOrCreateAssistantForProject` which essentially takes the project and repo together to configure the
      // OpenAI assistant.
      const { status: projectStatus, project } = projectConfig
      const { status: repoStatus, repo } = repoConfig

      // TODO: Get rid of magic strings
      // Since this method is invoked within a `useEffect` whose dependency
      // array depends on `repoConfig` we need to ensure that the project it is
      // associated with also is in a `CONFIGURED` state.
      if (projectStatus !== 'CONFIGURED') {
        // TODO: Get rid of magic strings in this debug statement
        console.debug(`Repo config for ${repo?.full_name} changed and is in a 'CONFIGURED' state but its associated project ${project?.name} isn't`)
        return
      }

      if (!project) {
        // TODO: Get rid of magic strings in this debug statement
        console.debug(`Repo config for ${repo?.full_name} changed and is in a 'CONFIGURED' state but its associated project doesn't have an instance`)
        return
      }

      // TODO: Get rid of magic strings
      if (repoStatus !== 'CONFIGURED') {
        // TODO: Get rid of magic strings in this debug statement
        console.debug(`Returning early from updating the AI since the repo causing this invocation isn't yet in a 'CONFIGURED' state`)
        return
      }

      projectConfig.project = project
      projectConfig.status = 'CONFIGURING'
      projectConfig.statusInfo = 'Configuring Sara For Project'
      projectConfig.errorInfo = null

      setProjectConfig(projectConfig)

      // TODO: Do I really want this try catch here or should I make this part of another state for project configuration?
      try {
        // We await this to ensure that any calls to the backend have data
        // references - whether they files have been processed or not.
        await tickleReposForProjectChange(repo ? [repo] : [])
      } catch (err) {
        // TODO: Should we cause a state change here?
        console.error(`Failed to tickle the repo ${repo?.full_name} project ${project?.name} because: ${err}`)
      }

      try {
        const assistant = await getOrCreateAssistantForProject(
          project,
          repo ? [repo] : [],
        )

        projectConfig.project.assistant = assistant
        projectConfig.status = 'CONFIGURED'
        // TODO: This is referenced somewhere so we probably want to move all of these 'status info' to a type for typechecking
        projectConfig.statusInfo = 'Sara Configured For Project'
        projectConfig.errorInfo = null

        setProjectConfig(projectConfig)
      } catch (err) {
        projectConfig.project = null
        projectConfig.status = 'ERROR'
        projectConfig.statusInfo  = ''
        projectConfig.errorInfo  = 'Error Configuring Sara For Project'
        setProjectConfig(projectConfig)
      }
    }
    updateAIOnRepositoryChange()
  }, [
    repoConfig
  ])
}

interface GlobalContextWatcherProps {
  children: ReactNode
}

export function GlobalContextWatcher({ children }: GlobalContextWatcherProps) {
  useDataWatcher() // This will invoke the data watching logic

  // Render your component (can be just a fragment if no UI is needed)
  return <div>{children}</div>
}
