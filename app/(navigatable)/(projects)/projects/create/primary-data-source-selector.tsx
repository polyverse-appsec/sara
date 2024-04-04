'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { DropdownMenuLabel } from '@radix-ui/react-dropdown-menu'
import {
  InfoCircledIcon,
  LockClosedIcon,
  LockOpen2Icon,
} from '@radix-ui/react-icons'
import { Badge, Callout } from '@radix-ui/themes'
import { getGitHubOrgs, getOrgStatus } from 'app/react-utils'
import { SaraSession } from 'auth'
import { Button } from 'components/ui/button'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../../components/ui/dropdown-menu'
import { getResource } from './../../../../../app/saraClient'
import LoadingSpinner from './../../../../../components/loading-spinner'
import {
  GitHubOrg,
  Org,
  type GitHubRepo,
} from './../../../../../lib/data-model-types'

interface DataSourceSelectorProps {
  userIsPremium: boolean
  setControlledProjectDataSources: (gitHubRepos: GitHubRepo[]) => void
}

const PrimaryDataSourceSelector = ({
  userIsPremium,
  setControlledProjectDataSources,
}: DataSourceSelectorProps) => {
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const [orgs, setOrgs] = useState<GitHubOrg[]>([])

  const [githubReposForOrgs, setGitHubReposForOrgs] = useState<
    Record<string, GitHubRepo[]>
  >({})

  const [githubReposForPersonal, setGithubReposForPersonal] = useState<
    GitHubRepo[]
  >([])

  const [personalReposSelected, setPersonalReposSelected] =
    useState<boolean>(false)

  const [
    gitHubAppInstallStatusByOrgNames,
    setGitHubAppInstallStatusByOrgNames,
  ] = useState<Record<string, string>>({})

  const [selectedGithubRepo, setSelectedGithubRepo] =
    useState<GitHubRepo | null>(null)

  const [selectedGithubOrg, setSelectedGithubOrg] = useState<GitHubOrg | null>(
    null,
  )

  const [shouldShowLoadingSpinner, setShouldShowLoadingSpinner] =
    useState<boolean>(true)

  async function fetchAndSetReposForPersonal() {
    let reposForPersonal: GitHubRepo[] = []
    try {
      // Fetch GitHub repos for the current orgName using the getResource function
      const repos = await getResource<GitHubRepo[]>(
        `/integrations/github/user/repos`,
        `Failed to get GitHub repos for user`,
      )

      reposForPersonal = repos
    } catch (error) {
      console.error(
        `Error fetching personal repos on data source select screen: `,
        error,
      )
    }

    setGithubReposForPersonal(reposForPersonal)
  }

  async function fetchAndSetReposForOrgs(orgs: GitHubOrg[]) {
    // Initialize an empty record to store org names as keys and their corresponding GitHubRepo arrays as values
    const reposForOrgs: Record<string, GitHubRepo[]> = {}

    // Loop through each org name in the orgs array
    for (const org of orgs) {
      try {
        // Fetch GitHub repos for the current orgName using the getResource function
        const repos = await getResource<GitHubRepo[]>(
          `/integrations/github/orgs/${org.login}/repos`,
          `Failed to get GitHub repos for organization '${org.login}'`,
        )

        // If successful, add the orgName as a key and its corresponding repos array as the value to the reposForOrgs record
        reposForOrgs[org.login] = repos
      } catch (error) {
        console.error(
          `Error fetching repos for org ${org.login} on data source select screen: `,
          error,
        )
        // Optionally handle errors, e.g., by setting an empty array or using a different fallback value
        reposForOrgs[org.login] = []
      }
    }

    // Once all orgs have been processed, update the state with the filled reposForOrgs record
    setGitHubReposForOrgs(reposForOrgs)
  }

  async function setAppInstalledStatusForOrgs(orgs: GitHubOrg[]) {
    if (!saraSession) {
      toast.error(`No session available`)
      return
    }

    const appInstallationStatuses: Record<string, string> = {}

    for (const org of orgs) {
      try {
        const orgStatus = await getOrgStatus(org.login)

        // If successful, add the orgName as a key and its corresponding repos array as the value to the reposForOrgs record
        appInstallationStatuses[org.login] = orgStatus.gitHubAppInstalled
      } catch (error) {
        console.error(
          `Error fetching installation status for ${org.login} on data source select screen: `,
          error,
        )
        appInstallationStatuses[org.login] = ''
      }
    }
    setGitHubAppInstallStatusByOrgNames(appInstallationStatuses)
  }

  useEffect(() => {
    ;(async () => {
      const fetchedGitHubOrgs = await getGitHubOrgs()

      setOrgs(fetchedGitHubOrgs)

      fetchAndSetReposForOrgs(fetchedGitHubOrgs)
      setAppInstalledStatusForOrgs(fetchedGitHubOrgs)
      fetchAndSetReposForPersonal()

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
            {personalReposSelected && (
              <span className="pl-1">Personal Repos</span>
            )}
            {selectedGithubOrg && (
              <span className="pl-1">{selectedGithubOrg.login}</span>
            )}
            {!personalReposSelected && !selectedGithubOrg && (
              <span className="flex pl-1 min-w-64 text-left">
                Select Repo Source...
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-64 max-h-60">
          <DropdownMenuItem
            onSelect={(event) => {
              setSelectedGithubOrg(null)
              setPersonalReposSelected(true)
            }}
          >
            <span className="font-semibold text-ellipsis whitespace-nowrap overflow-hidden">
              Personal Repos
            </span>
          </DropdownMenuItem>
          <DropdownMenuLabel>
            <div className="ml-2 font-semibold">Organizations</div>
            {orgs.map((org: GitHubOrg) => (
              <DropdownMenuItem
                key={org.login}
                onSelect={(event) => {
                  setPersonalReposSelected(false)
                  setSelectedGithubOrg(org)
                }}
              >
                <span className="ml-2 text-ellipsis whitespace-nowrap overflow-hidden">
                  {org.login}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* PERSONAL REPO DROPDOWN */}
      {personalReposSelected && (
        <div className="p-4 space-y-1 text-sm border rounded-md">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="pl-0 text-black-500">
                {selectedGithubRepo ? (
                  <span className="pl-1">{selectedGithubRepo.name}</span>
                ) : (
                  <span className="flex pl-1 min-w-64 text-left">
                    Select Repo...
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-64 max-h-60">
              {githubReposForPersonal.length > 0 ? (
                githubReposForPersonal.map((repo: GitHubRepo) => (
                  <DropdownMenuItem
                    key={repo.name}
                    onSelect={async (event) => {
                      setSelectedGithubRepo(repo)
                      setControlledProjectDataSources([repo])
                    }}
                    disabled={repo.private && !userIsPremium}
                  >
                    <span className="mx-2 text-ellipsis whitespace-nowrap overflow-hidden">
                      {repo.name}
                    </span>
                    {repo.private && !userIsPremium && (
                      <div className="p-1 rounded text-red-500 font-semibold text-xs bg-red-100">
                        Premium Requred
                      </div>
                    )}
                    {repo.private && userIsPremium && (
                      <div
                        title="Premium Access"
                        className="px-1 rounded text-green-500 font-semibold text-xs bg-green-100"
                      >
                        P
                      </div>
                    )}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem>
                  <span className="ml-2 text-ellipsis whitespace-nowrap overflow-hidden">
                    No personal repos available
                  </span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* SECOND REPO DROPDOWN */}
      {selectedGithubOrg && (
        <div>
          {gitHubAppInstallStatusByOrgNames[selectedGithubOrg.login] ===
            'INSTALLED' && (
            <div className="p-4 space-y-1 text-sm border rounded-md">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="pl-0 text-black-500">
                    {selectedGithubRepo ? (
                      <span className="pl-1">{selectedGithubRepo.name}</span>
                    ) : (
                      <span className="flex pl-1 min-w-64 text-left">
                        Select Repo...
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-64 max-h-60"
                >
                  {githubReposForOrgs[selectedGithubOrg?.login] ? (
                    githubReposForOrgs[selectedGithubOrg.login].map(
                      (repo: GitHubRepo) => (
                        <DropdownMenuItem
                          key={repo.name}
                          onSelect={async (event) => {
                            setSelectedGithubRepo(repo)
                            setControlledProjectDataSources([repo])
                          }}
                          disabled={repo.private && !userIsPremium}
                        >
                          <span className="mx-2 text-ellipsis whitespace-nowrap overflow-hidden">
                            {repo.name}
                          </span>
                          {repo.private && !userIsPremium && (
                            <div className="p-1 rounded text-red-500 font-semibold text-xs bg-red-100">
                              Premium Requred
                            </div>
                          )}
                          {repo.private && userIsPremium && (
                            <div
                              title="Premium Access"
                              className="px-1 rounded text-green-500 font-semibold text-xs bg-green-100"
                            >
                              P
                            </div>
                          )}
                        </DropdownMenuItem>
                      ),
                    )
                  ) : (
                    <DropdownMenuItem>
                      <span className="ml-2 text-ellipsis whitespace-nowrap overflow-hidden">
                        No repos available for this org
                      </span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          {gitHubAppInstallStatusByOrgNames[selectedGithubOrg.login] !==
            'INSTALLED' && (
            <Callout.Root color="orange">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                You will need to install the GitHub app for this org to access
                it&apos;s repos.{' '}
                <Link
                  href="https://github.com/apps/polyverse-boost"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  You can install here
                </Link>
              </Callout.Text>
            </Callout.Root>
          )}
        </div>
      )}
    </div>
  )
}

export default PrimaryDataSourceSelector
