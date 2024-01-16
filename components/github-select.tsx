import * as React from 'react'
import { IconSeparator } from '@/components/ui/icons'
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup
  // Other imports if necessary
} from '@/components/ui/select' // Update the import path

import { getOrCreateRepositoryFromGithub, getRepository } from '@/app/actions'

import { GithubOrgSelect } from './github-org-select'
import { GithubRepoSelect } from './github-repo-select'
import { type Session } from 'next-auth'
import { getOrganizations, getRepositoriesForOrg } from '@/app/actions'
import { useState, useEffect } from 'react'
import { Organization, Repository } from '@/lib/polyverse/data-model/dataModelTypes'

import { useAppContext } from '@/lib/hooks/app-context'
import { configDefaultRepositoryTask } from '@/lib/polyverse/task/task'

interface GitHubSelectProps {
  session: Session // Add the session prop
}

export function GithubSelect({ session }: GitHubSelectProps) {
  // component implementation
  const user = session.user

  const {
    selectedOrganization,
    setSelectedOrganization,
    selectedRepository,
    setSelectedRepository,
    setSelectedActiveTask
  } = useAppContext()

  // State to store organizations
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [repositories, setRepositories] = useState<Repository[]>([])

  // State to track if dropdown is open
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const fetchOrganizations = () => {
    console.log('Fetching organizations')
    getOrganizations()
      .then(data => {
        if (Array.isArray(data)) {
          setOrganizations(data)
        } else {
          console.error('Error fetching organizations:', data)
        }
      })
      .catch(error => {
        console.error('Error fetching organizations:', error)
      })
  }

  const fetchRepositories = (org: Organization) => {
    console.log('Fetching repositories for organization:', org)
    if (org) {
      getRepositoriesForOrg(org.login)
        .then(data => {
          if (Array.isArray(data)) {
            setRepositories(data)
          } else {
            console.error('Error fetching repositories:', data)
          }
        })
        .catch(error => {
          console.error('Error fetching repositories:', error)
        })
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const handleOrganizationChange = (org: Organization) => {
    console.log('Organization changed:', org)
    setSelectedOrganization(org)

    session.activeOrganization = org
    // Reset repositories when organization changes
    fetchRepositories(org)
  }

  const handleRepositoryChange = async (repo: Repository) => {
    // Persist the repo in the KV store
    const retrievedRepo = await getOrCreateRepositoryFromGithub(
      repo,
      session.user.id
    )

    // Ensure we set the relevant information in our apps context for other
    // core components to function correctly
    setSelectedRepository(retrievedRepo)

    if (retrievedRepo.defaultTask) {
      setSelectedActiveTask(retrievedRepo.defaultTask)
    }

    session.activeRepository = retrievedRepo
  }

  return (
    <>
      <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
      <GithubOrgSelect
        session={session}
        organizations={organizations}
        selectedOrganization={selectedOrganization}
        onOrganizationChange={handleOrganizationChange}
      />
      <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
      <GithubRepoSelect
        session={session}
        selectedRepository={selectedRepository}
        repositories={repositories}
        onRepositoryChange={handleRepositoryChange}
      />
    </>
  )
}
