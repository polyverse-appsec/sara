'use client'

import Image from 'next/image'
import { type Session } from 'next-auth'
import { signOut } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { IconExternalLink } from '@/components/ui/icons'
import { Repository } from '@/lib/types'

function getUserInitials(name: string) {
  const [firstName, lastName] = name.split(' ')
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName.slice(0, 2)
}

interface GithubRepoSelectProps {
  session: Session;
  selectedRepository: Repository | null;
  repositories: Repository[];
  onRepositoryChange: (repo: Repository) => void;
  // other props if any
}
export function GithubRepoSelect({ session, selectedRepository, repositories, onRepositoryChange }: GithubRepoSelectProps) { 
  const user = session.user;
  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="pl-0">
            {selectedRepository ? (
              <span className="ml-2">{selectedRepository.name}</span>
            ) : (
              <span className="ml-2">Select Repository</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start" className="w-[180px]">
          {
          repositories.map((repo) => (
              <DropdownMenuItem key={repo.name}
                onSelect={(event)=> onRepositoryChange(repo) }>
              <span className="ml-2">
                {repo.name}
              </span>
              </DropdownMenuItem>
            ))
} 
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
