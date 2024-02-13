import * as React from 'react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { Organization, Repository } from '../lib/data-model-types'
import { getOrCreateProjectForRepo } from './../app/_actions/get-or-create-project-for-repo'
import { getOrganizations } from './../app/_actions/get-organizations'
import { getRepositoriesForOrg } from './../app/_actions/get-repositories-for-org'
import {
  useAppContext,
  type SaraOrganization,
  type SaraProject,
  ProjectConfigurable,
} from './../lib/hooks/app-context'
import { GithubOrgSelect } from './github-org-select'
import { GithubRepoSelect } from './github-repo-select'
import { ProjectConfigurationButton } from './project-configuration-button'
import { IconSeparator } from './ui/icons'

import { type ProjectDataReferenceState, ProjectConfigurationDialog } from './project-configuration-dialog'

const createProjectReferencesForRepoChange = (fetchedRepos: Repository[], selectedRepo: Repository) => {
  const projectReferences = fetchedRepos.filter(fetchedRepo => fetchedRepo.id !== selectedRepo.id).map(fetchedRepo => ({
    checked: false,
    repo: fetchedRepo
  }))

  return projectReferences
}

export function GithubSelect() {
  const {
    user,
    saraConfig: { orgConfig, projectConfig, repoConfig },
    setOrgConfig,
    setProjectConfig,
    setRepoConfig,
  } = useAppContext()

  const [organizations, setOrganizations] = useState<Organization[]>([])

  const [isProjectConfigModalOpen, setIsProjectConfigModalOpen] = useState(false)
  // TODO: When repo is changed we need to reset this to the new list of repos that were fetched sans the one selected
  const [controlledProjectReferences, setControlledProjectReferences] = useState<ProjectDataReferenceState[]>([])

  const fetchOrganizations = async () => {
    try {
      const orgs = await getOrganizations()
      setOrganizations(orgs)
    } catch (err) {
      toast.error('Unable to fetch organizations')
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const handleOrganizationChange = (org: Organization) => {
    console.debug(`Organization changed to: ${org.login}`)

    // TODO: Probbly need a helper method to build the status, statusInfo, and errorInfo and default to errorInfo being null
    orgConfig.organization = org as SaraOrganization
    orgConfig.status = 'CONFIGURING'
    orgConfig.statusInfo = 'Discovering Repositories'
    orgConfig.errorInfo = null
    setOrgConfig(orgConfig)

    // Reset repositories when organization changes
    fetchRepositories(org)
  }

  const fetchRepositories = async (org: Organization) => {
    if (org) {
      try {
        const repos = await getRepositoriesForOrg(org.login)
        console.debug(`Repositories fetched for organization: ${org.login}`)

        const repositoriesById = repos.reduce(
          (accumulator, repo) => {
            accumulator[repo.id] = repo
            return accumulator
          },
          {} as Record<string, Repository>,
        )

        orgConfig.organization = org as SaraOrganization
        // TODO: Originally was setRepositories(data) where data is what was returned from `getRepositoriesForOrg`
        orgConfig.organization.repositoriesById = repositoriesById
        orgConfig.status = 'CONFIGURED'
        orgConfig.statusInfo = 'Repositories Discovered'

        setOrgConfig(orgConfig)
      } catch (err) {
        console.error(
          `Error configuring repositories for org '${org.login}': ${err}`,
        )

        orgConfig.organization = org as SaraOrganization
        orgConfig.organization.repositoriesById = {}
        orgConfig.status = 'ERROR'
        orgConfig.statusInfo = ''
        orgConfig.errorInfo = 'Error Discovering Repositories - Please Switch Between Organizations Again'

        setOrgConfig(orgConfig)
      }
    }
  }

  if (!user) {
    return null
  }

  const handleRepositoryChange = async (repo: Repository) => {
    console.debug(`Repository changed to: ${repo.full_name}`)

    projectConfig.project = null
    projectConfig.status = 'CONFIGURING'
    projectConfig.statusInfo = 'Discovering Project Data'
    projectConfig.errorInfo = null
    setProjectConfig(projectConfig)

    try {
      const retrievedProject = await getOrCreateProjectForRepo(repo, user)
      console.debug(`Project created/retrieved for: ${repo.full_name}`)

      projectConfig.project = retrievedProject as SaraProject
      projectConfig.status = 'CONFIGURED'
      projectConfig.statusInfo = 'Project Data Discovered'
      projectConfig.errorInfo = null
      setProjectConfig(projectConfig)

      const controlledProjectReferences = createProjectReferencesForRepoChange(fetchedRepos, repo)
      setControlledProjectReferences(controlledProjectReferences)

      repoConfig.repo = repo
      repoConfig.status = 'CONFIGURED'
      repoConfig.statusInfo = 'Repsitory Data Discovered'
      repoConfig.errorInfo = null
      setRepoConfig(repoConfig)
    } catch (err) {
      console.error('Error configuring project: ', err)

      // Display the repo error state first since the project error state will
      // roll up and is the more significant of the configurations having an
      // error
      repoConfig.repo = null
      repoConfig.status = 'ERROR'
      repoConfig.statusInfo = ''
      repoConfig.errorInfo = 'Error Discovering Repository Data - Please Switch Between Repositories Again'
      setRepoConfig(repoConfig)

      projectConfig.project = null
      projectConfig.status = 'ERROR'
      projectConfig.statusInfo = ''
      projectConfig.errorInfo = 'Error Discovering Project Data - Please Switch Between Repositories Again'
      setProjectConfig(projectConfig)
    }
  }

  const { status: orgStatus } = orgConfig
  const { status: projectStatus } = projectConfig
  const { status: repoStatus } = repoConfig

  const fetchedRepos =
    orgConfig.organization && orgConfig.organization.repositoriesById
      ? Object.values(orgConfig.organization.repositoriesById)
      : []

  const projectDataReferences = fetchedRepos.filter(fetchedRepo => fetchedRepo.id !== repoConfig.repo?.id)

  // TODO: Comment - w-204px - 180 for the drop down and 24 for IconSeparator
  return (
    <>
      <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
      <GithubOrgSelect
        user={user}
        organizations={organizations}
        selectedOrganization={orgConfig.organization}
        onOrganizationChange={handleOrganizationChange}
      />
      {orgStatus === 'CONFIGURED' ? (
        <>
          <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
          <GithubRepoSelect
            selectedRepository={
              repoStatus === 'CONFIGURED' ? repoConfig.repo : null
            }
            repositories={fetchedRepos}
            onRepositoryChange={handleRepositoryChange}
          />
        </>
      ) : (
        <div className="w-[204px]"></div>
      )}
      {repoStatus === 'CONFIGURED' ? (
        <>
        <div className="mx-p12">
          <ProjectConfigurationButton onClick={() => setIsProjectConfigModalOpen(!isProjectConfigModalOpen)} />
        </div>
        <ProjectConfigurationDialog
          projectDataReferences={projectDataReferences}
          open={isProjectConfigModalOpen}
          onOpenChange={(open: boolean) => setIsProjectConfigModalOpen(open)}
          onSaveConfig={(config: ProjectConfigurable | null) => {
            // TODO: NEED TO SAVE STILL
            console.log(`***** NEED TO SAVE STILL`)
            setIsProjectConfigModalOpen(!isProjectConfigModalOpen)
          }}
        />
        </>
      ) : null}
    </>
  )
}
