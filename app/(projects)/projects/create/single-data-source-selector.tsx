'use client'

import React, { useEffect, useState } from 'react'
import { Button } from 'components/ui/button'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu'
import LoadingSpinner from './../../../../components/loading-spinner'
import { type GitHubRepo } from './../../../../lib/data-model-types'

interface DataSourceSelectorProps {
  orgName: string
  setControlledProjectDataSources: (gitHubRepos: GitHubRepo[]) => void
}

const SingleDataSourceSelector = ({
  orgName,
  setControlledProjectDataSources,
}: DataSourceSelectorProps) => {
  const [githubRepos, setGitHubRepos] = useState<GitHubRepo[]>([])
  const [selectedGithubRepo, setSelectedGithubRepo] =
    useState<GitHubRepo | null>(null)

  const [shouldShowLoadingSpinner, setShouldShowLoadingSpinner] =
    useState<boolean>(true)

  useEffect(() => {
    ;(async () => {
      const res = await fetch(`/api/integrations/github/orgs/${orgName}/repos`)

      if (!res.ok) {
        const errText = await res.text()

        throw new Error(
          `Failed to get a success response when fetching GitHub repos because: ${errText}`,
        )
      }

      const repos = (await res.json()) as GitHubRepo[]
      setGitHubRepos(repos)

      setShouldShowLoadingSpinner(false)
    })()
  }, [])

  if (shouldShowLoadingSpinner) {
    return <LoadingSpinner />
  }

  if (Object.entries(githubRepos).length === 0) {
    return 'No repos available to use as data sources for a project'
  }

  return (
    <div className="p-4 space-y-1 text-sm border rounded-md">
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="pl-0 text-black-500">
              {selectedGithubRepo ? (
                <span className="pl-1">{selectedGithubRepo.name}</span>
              ) : (
                <span className="flex pl-1 min-w-64 text-left">
                  Data Sources...
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            sideOffset={8}
            align="start"
            className="min-w-64 max-h-60"
          >
            {githubRepos.map((repo) => (
              <DropdownMenuItem
                key={repo.name}
                onSelect={(event) => {
                  setSelectedGithubRepo(repo)
                  // Now update the primary data source...
                  setControlledProjectDataSources([repo]) // Fix: Wrap repo in an array since we currently only allow single data source to be selected
                }}
              >
                <span className="ml-2 text-ellipsis whitespace-nowrap overflow-hidden">
                  {repo.name}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default SingleDataSourceSelector
