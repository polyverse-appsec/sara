'use client'

import Image from 'next/image'
import { type Session } from 'next-auth'
import { signOut } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { getOrganizations } from '@/app/actions'
import React, { useState, useEffect } from 'react';
import { Organization } from '@/lib/polyverse/github/repos'


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { IconExternalLink } from '@/components/ui/icons'

function getUserInitials(name: string) {
  const [firstName, lastName] = name.split(' ')
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName.slice(0, 2)
}

interface GithubOrgSelectProps {
  session: Session;
  selectedOrganization: Organization | null;
  organizations: Organization[];
  onOrganizationChange: (org: Organization) => void;
  // other props if any
}

export function GithubOrgSelect({ session, organizations, selectedOrganization, onOrganizationChange}: GithubOrgSelectProps) {
  // component implementation
  const user = session.user;

  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="pl-0">
            {user?.image ? (
              <Image
                className="w-6 h-6 transition-opacity duration-300 rounded-full select-none ring-1 ring-zinc-100/10 hover:opacity-80"
                src={user?.image ? `${user.image}&s=60` : ''}
                alt={user.name ?? 'Avatar'}
                height={48}
                width={48}
              />
            ) : (
              <div className="flex items-center justify-center text-xs font-medium uppercase rounded-full select-none h-7 w-7 shrink-0 bg-muted/50 text-muted-foreground">
                {user?.name ? getUserInitials(user?.name) : null}
              </div>
            )}
            <span className="ml-2">alexgo</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start" className="w-[180px]">
          <DropdownMenuSeparator />
          {
            organizations.map(org => (
              <DropdownMenuItem key={org.login}>
                {org.login}
              </DropdownMenuItem>
            ))
          }
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}