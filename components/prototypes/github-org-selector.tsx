'use client'

import React, { use, useState } from 'react'
import { type GitHubOrg, type OrgPartDeux } from 'lib/data-model-types'

import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

const getGitHubOrgs = async (): Promise<GitHubOrg[]> => {
  const res = await fetch('/api/integrations/github/orgs')

  if (!res.ok) {
    const errText = await res.text()

    throw new Error(
      `Failed to get a success response when fetching GitHub organizations because: ${errText}`,
    )
  }

  return res.json()
}

const getBillingOrgs = async (): Promise<OrgPartDeux[]> => {
  const res = await fetch('/api/orgs')

  if (!res.ok) {
    const errText = await res.text()

    throw new Error(
      `Failed to get a success response when fetching billing organizations because: ${errText}`,
    )
  }

  return res.json()
}

interface SuspendedOrgSelectorProps {
  setControlledGitHubOrg: (gitHugOrg: GitHubOrg) => void
}

const SuspendedOrgSelector = ({
  setControlledGitHubOrg,
}: SuspendedOrgSelectorProps) => {
  const billingOrgs = use(getBillingOrgs())
  const gitHubOrgs = use(getGitHubOrgs())

  // Filter the GitHub orgs by removing those that already exist by name on the
  // billing org instances
  const billingOrgsByName = billingOrgs.reduce(
    (accumulator, billingOrg) => {
      accumulator[billingOrg.name] = billingOrg
      return accumulator
    },
    {} as Record<string, OrgPartDeux>,
  )

  const filteredGitHubOrgs = gitHubOrgs.filter(
    (gitHubOrg) => !billingOrgsByName[gitHubOrg.login],
  )

  return (
    <OrgSelector
      gitHubOrgs={filteredGitHubOrgs}
      setControlledGitHubOrg={setControlledGitHubOrg}
    />
  )
}

interface OrgSelectorProps {
  gitHubOrgs: GitHubOrg[]
  setControlledGitHubOrg: (gitHugOrg: GitHubOrg) => void
}

const OrgSelector = ({
  gitHubOrgs,
  setControlledGitHubOrg,
}: OrgSelectorProps) => {
  const [selectedGitHubOrg, setSelectedGitHubOrg] = useState<GitHubOrg | null>(
    null,
  )

  if (gitHubOrgs.length === 0) {
    return (
      <div className="text-base">
        <p>
          No GitHub organizations available to create as a billing organization.
        </p>
      </div>
    )
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="pl-0">
            {selectedGitHubOrg ? (
              <span className="pl-1">{selectedGitHubOrg.login}</span>
            ) : (
              <span className="flex pl-1 min-w-64 text-left">
                Available Organizations...
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start" className="min-w-64">
          {gitHubOrgs.map((gitHubOrg) => (
            <DropdownMenuItem
              key={gitHubOrg.login}
              onSelect={() => {
                // Set the controlled state first...
                setControlledGitHubOrg(gitHubOrg)

                // Then set our local state for visual rendering effects...
                setSelectedGitHubOrg(gitHubOrg)
              }}
            >
              <span className="ml-2 text-ellipsis whitespace-nowrap overflow-hidden">
                {gitHubOrg.login}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default SuspendedOrgSelector
