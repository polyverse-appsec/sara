import * as React from 'react'
import { useEffect, useState } from 'react'
import { type Session } from 'next-auth'

import { Organization, Project, Repository } from '../lib/data-model-types'
import { useAppContext, type SaraOrganization, type SaraProject } from './../lib/hooks/app-context'
import { IconSeparator } from './ui/icons'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  // Other imports if necessary
} from './ui/select'
// Update the import path

import {
  getOrCreateProjectFromRepository,
  getOrganizations,
  getRepositoriesForOrg,
  getRepository,
} from './../app/actions'

import { GithubOrgSelect } from './github-org-select'
import { GithubRepoSelect } from './github-repo-select'

export function GithubSelect() {
  const {
    user,
    selectedOrganization,
    setSelectedOrganization,
    selectedProject,
    setSelectedProject,
    setSelectedActiveTask,
    saraConfig: { orgConfig, projectConfig, repoConfig },
    setOrgConfig,
    setProjectConfig,
    setRepoConfig
  } = useAppContext()

  // State to store organizations
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [selectedRepository, setSelectedRepository] =
    useState<Repository | null>(null)

  // State to track if dropdown is open
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const { status: orgStatus } = orgConfig

  // console.log(`***** GithubSelect - saraConfig: ${JSON.stringify(saraConfig)}`)
  // TODO: Turn off repo select if org not configured yet

  const fetchOrganizations = () => {
    console.log('Fetching organizations')
    getOrganizations()
      .then((data) => {
        if (Array.isArray(data)) {
          setOrganizations(data)
        } else {
          console.error('Error fetching organizations:', data)
        }
      })
      .catch((error) => {
        console.error('Error fetching organizations:', error)
      })
  }


  const handleOrganizationChange = (org: Organization) => {
    console.debug(`Organization changed to: ${org.login}`)

    // TODO: Probbly need a helper method to build the status, statusInfo, and errorInfo and default to errorInfo being null
    orgConfig.organization = org as SaraOrganization
    orgConfig.status = 'CONFIGURING'
    orgConfig.statusInfo  = 'Configuring Repositories'
    orgConfig.errorInfo = null
    setOrgConfig(orgConfig)

    // TODO: Identify where this state is still used and remove
    console.log('Organization changed:', org)
    setSelectedOrganization(org)

    // Reset repositories when organization changes
    fetchRepositories(org)
  }

  const fetchRepositories = async (org: Organization) => {
    if (org) {
      try {
        const repos = await getRepositoriesForOrg(org.login)
        console.debug(`Repositories fetched for organization: ${org.login}`)

        const repositoriesById = repos.reduce((accumulator, repo) => {
          accumulator[repo.id] = repo
          return accumulator
        }, {} as Record<string, Repository>)

        orgConfig.organization = org as SaraOrganization
        // TODO: Originally was setRepositories(data) where data is what was returned from `getRepositoriesForOrg`
        orgConfig.organization.repositoriesById = repositoriesById
        orgConfig.status = 'CONFIGURED'
        orgConfig.statusInfo  = 'Repositories Configured'

        setOrgConfig(orgConfig)
      } catch (err) {
        // TODO: Where do we log this error?
        console.error(`Error configuring repositories for org '${org.login}': ${err}`)

        orgConfig.organization = org as SaraOrganization
        orgConfig.organization.repositoriesById = {}
        orgConfig.status = 'ERROR'
        orgConfig.statusInfo  = ''
        orgConfig.errorInfo  = 'Error Configuring Repositories'

        setOrgConfig(orgConfig)
      }
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  if (!user) {
    return null
  }

  const handleRepositoryChange = async (repo: Repository) => {
    console.debug(`Repository changed to: ${repo.full_name}`)

    projectConfig.project = null
    projectConfig.status = 'CONFIGURING'
    projectConfig.statusInfo  = 'Configuring Project'
    projectConfig.errorInfo = null
    setProjectConfig(projectConfig)

    try {
      const retrievedProject = await getOrCreateProjectFromRepository(repo, user)
      console.debug(`Project created/retrieved for: ${repo.full_name}`)

      projectConfig.project = retrievedProject as SaraProject
      projectConfig.status = 'CONFIGURED'
      projectConfig.statusInfo  = 'Project Configured'
      projectConfig.errorInfo = null
      setProjectConfig(projectConfig)

      repoConfig.repo = repo
      repoConfig.status = 'CONFIGURED'
      repoConfig.statusInfo  = 'Repo Configured'
      repoConfig.errorInfo  = null
      setRepoConfig(repoConfig)
    } catch (err) {
      console.error('Error configuring project: ', err)

      // Display the repo error state first since the project error state will
      // roll up and is the more significant of the configurations having an
      // error
      repoConfig.repo = null
      repoConfig.status = 'ERROR'
      repoConfig.statusInfo  = ''
      repoConfig.errorInfo  = 'Error Configuring Repo'
      setRepoConfig(repoConfig)

      projectConfig.project = null
      projectConfig.status = 'ERROR'
      projectConfig.statusInfo  = ''
      projectConfig.errorInfo  = 'Error Configuring Project'
      setProjectConfig(projectConfig)
    }

    // Ensure we set the relevant information in our apps context for other
    // core components to function correctly
    setSelectedRepository(repo) //this sets the local UI state for the selected repo
    setSelectedProject(projectConfig.project)

    if (projectConfig.project?.defaultTask) {
      setSelectedActiveTask(projectConfig.project.defaultTask)
    }
  }

  const fetchedRepos = orgConfig.organization && orgConfig.organization.repositoriesById ? Object.values(orgConfig.organization.repositoriesById) : []

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
      {
        orgStatus === 'CONFIGURED' ? (
          <>
            <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
            <GithubRepoSelect
              selectedRepository={selectedRepository}
              repositories={fetchedRepos}
              onRepositoryChange={handleRepositoryChange}
            />
          </>
        ) : <div className='w-[204px]'></div>
      }
      
    </>
  )
}
