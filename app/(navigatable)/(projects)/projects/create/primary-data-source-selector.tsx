'use client'

import React, { useEffect, useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@radix-ui/react-collapsible'
import { LockClosedIcon } from '@radix-ui/react-icons'
import { getOrgStatus } from 'app/react-utils'
import { SaraSession } from 'auth'
import { Button } from 'components/ui/button'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../../../../../components/ui/dropdown-menu'
import { getResource } from './../../../../../app/saraClient'
import LoadingSpinner from './../../../../../components/loading-spinner'
import { Org, type GitHubRepo } from './../../../../../lib/data-model-types'

interface DataSourceSelectorProps {
  setControlledProjectDataSources: (gitHubRepos: GitHubRepo[]) => void
}

const PrimaryDataSourceSelector = ({
  setControlledProjectDataSources,
}: DataSourceSelectorProps) => {
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null
  const [orgs, setOrgs] = useState([])
  const [githubReposForOrgs, setGitHubReposForOrgs] = useState<
    Record<string, GitHubRepo[]>
  >({})
  const [githubAppInstalledForOrgs, setGitHubAppInstalledForOrgs] = useState<
    Record<string, string>
  >({})
  const [selectedGithubRepo, setSelectedGithubRepo] =
    useState<GitHubRepo | null>(null)

  const [shouldShowLoadingSpinner, setShouldShowLoadingSpinner] =
    useState<boolean>(true)

  async function fetchAndSetReposForOrgs(orgs: Org[]) {
    // Initialize an empty record to store org names as keys and their corresponding GitHubRepo arrays as values
    const reposForOrgs: Record<string, GitHubRepo[]> = {}

    // Loop through each org name in the orgs array
    for (const org of orgs) {
      try {
        // Fetch GitHub repos for the current orgName using the getResource function
        const repos = await getResource<GitHubRepo[]>(
          `/integrations/github/orgs/${org.name}/repos`,
          `Failed to get GitHub repos for organization '${org.name}'`,
        )

        // If successful, add the orgName as a key and its corresponding repos array as the value to the reposForOrgs record
        reposForOrgs[org.name] = repos
      } catch (error) {
        console.error(
          `Error fetching repos for org ${org.name} on data source select screen: `,
          error,
        )
        // Optionally handle errors, e.g., by setting an empty array or using a different fallback value
        reposForOrgs[org.name] = []
      }
    }

    // Once all orgs have been processed, update the state with the filled reposForOrgs record
    setGitHubReposForOrgs(reposForOrgs)
  }

  async function setAppInstalledStatusForOrgs(orgs: Org[]) {
    if (!saraSession) {
      toast.error(`No session available`)
      return
    }

    const appInstallationStatuses: Record<string, string> = {}

    for (const org of orgs) {
      try {
        const orgStatus = await getOrgStatus(org.id, saraSession.id)

        // If successful, add the orgName as a key and its corresponding repos array as the value to the reposForOrgs record
        appInstallationStatuses[org.name] = orgStatus.gitHubAppInstalled
      } catch (error) {
        console.error(
          `Error fetching installation status for ${org.name} on data source select screen: `,
          error,
        )
        appInstallationStatuses[org.name] = ''
      }
    }
    setGitHubAppInstalledForOrgs(appInstallationStatuses)
  }

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/orgs')

      if (!res.ok) {
        const errText = await res.text()

        throw new Error(
          `Failed to get a success response when fetching organizations because: ${errText}`,
        )
      }

      const fetchedOrgs = await res.json()

      setOrgs(fetchedOrgs)

      fetchAndSetReposForOrgs(fetchedOrgs)
      setAppInstalledStatusForOrgs(fetchedOrgs)

      setShouldShowLoadingSpinner(false)
    })()
  }, [])

  if (shouldShowLoadingSpinner) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-4 space-y-1 text-sm border rounded-md">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="pl-0 text-black-500">
            {selectedGithubRepo ? (
              <span className="pl-1">{selectedGithubRepo.name}</span>
            ) : (
              <span className="flex pl-1 min-w-64 text-left">
                Select Org...
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          sideOffset={8}
          align="start"
          className="min-w-64 max-h-60"
        >
          {orgs.map((org: Org) => (
            <Collapsible
              key={org.name}
              className={
                githubAppInstalledForOrgs[org.name] === 'INSTALLED'
                  ? ''
                  : 'select-none opacity-50 grayscale pointer-events-none'
              }
            >
              <CollapsibleTrigger>
                <div className="flex items-center">
                  <DropdownMenuLabel>{org.name}</DropdownMenuLabel>
                  {githubAppInstalledForOrgs[org.name] !== 'INSTALLED' ? (
                    <div
                      title="Please install github app for this org to access its repos"
                      className="pointer-events-auto"
                    >
                      <LockClosedIcon className="w-4 h-4" />
                    </div>
                  ) : null}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {githubReposForOrgs[org.name] ? (
                  githubReposForOrgs[org.name].map((repo: GitHubRepo) => (
                    <DropdownMenuItem
                      key={repo.name}
                      onSelect={async (event) => {
                        setSelectedGithubRepo(repo)
                        setControlledProjectDataSources([repo])
                      }}
                    >
                      <span className="ml-2 text-ellipsis whitespace-nowrap overflow-hidden">
                        {repo.name}
                      </span>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem>
                    <span className="ml-2 text-ellipsis whitespace-nowrap overflow-hidden">
                      No repos available for this org
                    </span>
                  </DropdownMenuItem>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default PrimaryDataSourceSelector
