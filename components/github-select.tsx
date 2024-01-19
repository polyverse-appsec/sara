import * as React from 'react'
import { useEffect, useState } from 'react'
import { type Session } from 'next-auth'

import { Organization, Project, Repository } from '@/lib/dataModelTypes'
import { useAppContext } from '@/lib/hooks/app-context'
import { IconSeparator } from '@/components/ui/icons'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  // Other imports if necessary
} from '@/components/ui/select'
// Update the import path

import {
  getOrCreateProjectFromRepository,
  getOrganizations,
  getRepositoriesForOrg,
  getRepository,
} from '@/app/actions'

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
    selectedProjectRepositories,
    setSelectedProjectRepositories,
  } = useAppContext()

  // State to store organizations
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [selectedRepository, setSelectedRepository] =
    useState<Repository | null>(null)

  // State to track if dropdown is open
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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

  const fetchRepositories = (org: Organization) => {
    console.log('Fetching repositories for organization:', org)
    if (org) {
      getRepositoriesForOrg(org.login)
        .then((data) => {
          if (Array.isArray(data)) {
            setRepositories(data)
          } else {
            console.error('Error fetching repositories:', data)
          }
        })
        .catch((error) => {
          console.error('Error fetching repositories:', error)
        })
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  if (!user) {
    return null
  }
  const handleOrganizationChange = (org: Organization) => {
    console.log('Organization changed:', org)
    setSelectedOrganization(org)

    // Reset repositories when organization changes
    fetchRepositories(org)
  }

  const handleRepositoryChange = async (repo: Repository) => {
    // Persist the repo in the KV store

    const retrievedProject = await getOrCreateProjectFromRepository(repo, user)

    // Ensure we set the relevant information in our apps context for other
    // core components to function correctly
    setSelectedRepository(repo) //this sets the local UI state for the selected repo
    setSelectedProject(retrievedProject)
    setSelectedProjectRepositories([repo]) //this sets the global appContext state for active repositories

    if (retrievedProject?.defaultTask) {
      setSelectedActiveTask(retrievedProject.defaultTask)
    }
  }

  return (
    <>
      <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
      <GithubOrgSelect
        user={user}
        organizations={organizations}
        selectedOrganization={selectedOrganization}
        onOrganizationChange={handleOrganizationChange}
      />
      <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
      <GithubRepoSelect
        selectedRepository={selectedRepository}
        repositories={repositories}
        onRepositoryChange={handleRepositoryChange}
      />
    </>
  )
}
