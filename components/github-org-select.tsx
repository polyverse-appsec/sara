'use client'

import React from 'react'
import Image from 'next/image'

import { Organization, User } from './../lib/dataModelTypes'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

function getUserInitials(name: string) {
  const [firstName, lastName] = name.split(' ')
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName.slice(0, 2)
}

interface GithubOrgSelectProps {
  user: User
  selectedOrganization: Organization | null
  organizations: Organization[]
  onOrganizationChange: (org: Organization) => void
  // other props if any
}

export function GithubOrgSelect({
  user,
  organizations,
  selectedOrganization,
  onOrganizationChange,
}: GithubOrgSelectProps) {
  // component implementation

  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="pl-0">
            {selectedOrganization?.avatar_url ? (
              <Image
                className="w-6 h-6 transition-opacity duration-300 rounded-full select-none ring-1 ring-zinc-100/10 hover:opacity-80"
                src={
                  selectedOrganization?.avatar_url
                    ? `${selectedOrganization.avatar_url}&s=60`
                    : ''
                }
                alt={selectedOrganization?.login ?? 'Avatar'}
                height={48}
                width={48}
              />
            ) : (
              <div className="flex items-center justify-center text-xs font-medium uppercase rounded-full select-none h-7 w-7 shrink-0 bg-muted/50 text-muted-foreground">
                {user?.name ? getUserInitials(user?.name) : null}
              </div>
            )}
            {selectedOrganization?.login ? (
              <span className="ml-2">{selectedOrganization.login}</span>
            ) : (
              'Select Organization'
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start" className="w-[180px]">
          <DropdownMenuSeparator />
          {organizations.map((org, index) => (
            <DropdownMenuItem
              key={index}
              onSelect={(event) => onOrganizationChange(org)}
            >
              <Image
                className="w-6 h-6 transition-opacity duration-300 rounded-full select-none ring-1 ring-zinc-100/10 hover:opacity-80"
                src={org?.avatar_url ? `${org.avatar_url}&s=60` : ''}
                alt={org.login ?? 'Avatar'}
                height={48}
                width={48}
              />
              <span className="ml-2">{org.login}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
