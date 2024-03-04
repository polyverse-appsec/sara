'use client'

import React, { useEffect, useState } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'
import * as ScrollArea from '@radix-ui/react-scroll-area'

import LoadingSpinner from './../../../../components/loading-spinner'
import { type GitHubRepo } from './../../../../lib/data-model-types'

interface DataSourceCheckboxState {
  checked: boolean
  repo: GitHubRepo
}

interface DataSourceSelectorProps {
  orgName: string
  setControlledProjectDataSources: (gitHubRepos: GitHubRepo[]) => void
}

const createDataSourceCheckboxStates = (
  gitHubRepos: GitHubRepo[],
): Record<string, DataSourceCheckboxState> =>
  gitHubRepos.reduce(
    (accumulator, gitHubRepo) => {
      accumulator[gitHubRepo.name] = {
        checked: false,
        repo: gitHubRepo,
      }
      return accumulator
    },
    {} as Record<string, DataSourceCheckboxState>,
  )

const DataSourceSelector = ({
  orgName,
  setControlledProjectDataSources,
}: DataSourceSelectorProps) => {
  const [dataSourceCheckboxStates, setDataSourceCheckboxStates] = useState<
    Record<string, DataSourceCheckboxState>
  >({})

  const [shouldShowLoadingSpinner, setShouldShowLoadingSpinner] =
    useState<boolean>(true)

  // TODO: Use this pattern with the org selector instead of react suspense
  // TODO: Rename github-org-selector to org-selector
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
      const checkboxStates = createDataSourceCheckboxStates(repos)

      setDataSourceCheckboxStates(checkboxStates)
      setShouldShowLoadingSpinner(false)
    })()
  }, [])

  if (shouldShowLoadingSpinner) {
    return <LoadingSpinner />
  }

  if (Object.entries(dataSourceCheckboxStates).length === 0) {
    return 'No repos available to use as data sources for a project'
  }

  return (
    <ScrollArea.Root>
      <ScrollArea.Viewport className="max-h-80">
        {Object.entries(dataSourceCheckboxStates).map(
          ([repoName, { checked }]) => (
            <div
              className="py-1"
              style={{ display: 'flex', alignItems: 'center' }}
              key={repoName}
            >
              <Checkbox.Root
                className="flex items-center justify-center w-5 h-5 bg-white border border-gray-600 rounded-md shadow opacity-95 focus:opacity-100"
                id={repoName}
                checked={checked}
                onCheckedChange={(checked) => {
                  if (checked !== 'indeterminate') {
                    dataSourceCheckboxStates[repoName].checked = checked
                  }

                  setDataSourceCheckboxStates(dataSourceCheckboxStates)

                  const selectedDataSources = Object.values(
                    dataSourceCheckboxStates,
                  )
                    .filter(
                      (dataSourceCheckboxState) =>
                        dataSourceCheckboxState.checked === true,
                    )
                    .map(
                      (dataSourceCheckboxState) => dataSourceCheckboxState.repo,
                    )

                  setControlledProjectDataSources(selectedDataSources)
                }}
              >
                <Checkbox.Indicator>
                  <CheckIcon />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label className="pl-2" htmlFor={repoName}>
                {repoName}
              </label>
            </div>
          ),
        )}
      </ScrollArea.Viewport>
      {/* Use select-none to ensure that no selection can be done of text*/}
      <ScrollArea.Scrollbar
        className="flex select-none p-2 bg-gray-200 transition ease-in-out delay-150 hover:bg-gray-600"
        orientation="vertical"
      >
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner />
    </ScrollArea.Root>
  )
}

export default DataSourceSelector
