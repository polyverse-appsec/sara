'use client'

import React, { useEffect, useState } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'
import * as ScrollArea from '@radix-ui/react-scroll-area'

import { getResource } from './../../../../../app/saraClient'
import LoadingSpinner from './../../../../../components/loading-spinner'
import { type GitHubRepo } from './../../../../../lib/data-model-types'

interface DataSourceCheckboxState {
  checked: boolean
  repo: GitHubRepo
}

interface DataSourceSelectorProps {
  orgName: string
  setControlledProjectDataSources: (gitHubRepos: GitHubRepo[]) => void
}

// Creates the intial data source checkbox states from a list of GitHub repos
const createInitialDataSourceCheckboxStates = (
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

  useEffect(() => {
    ;(async () => {
      const repos = await getResource<GitHubRepo[]>(
        `/integrations/github/orgs/${orgName}/repos`,
        'Failed to get a success response when fetching GitHub repos',
      )

      const checkboxStates = createInitialDataSourceCheckboxStates(repos)

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
                className="flex items-center justify-center w-5 h-5 bg-background border border-gray-600 rounded-md shadow opacity-95 focus:opacity-100"
                id={repoName}
                checked={checked}
                onCheckedChange={(checked) => {
                  // 03/12/24: For the initial release which is scheduled for
                  // 03/15 we are only allowing a single repo source to be
                  // selected. In this case just set checkbox to false before
                  // evaluating to see if its check state has been set.
                  Object.keys(dataSourceCheckboxStates).forEach((repoName) => {
                    dataSourceCheckboxStates[repoName].checked = false
                  })

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
        className="flex select-none p-2 bg-background transition ease-in-out delay-150 hover:bg-gray-600"
        orientation="vertical"
      >
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner />
    </ScrollArea.Root>
  )
}

export default DataSourceSelector
