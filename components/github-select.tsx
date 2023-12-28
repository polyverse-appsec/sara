import * as React from 'react';
import { IconSeparator } from '@/components/ui/icons';
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
  // Other imports if necessary
} from '@/components/ui/select'; // Update the import path
import { GithubOrgSelect } from './github-org-select';
import { GithubRepoSelect } from './github-repo-select';
import { type Session } from 'next-auth';

interface GitHubSelectProps {
  session: Session; // Add the session prop
}

export function GithubSelect({ session }: GitHubSelectProps) {
  return (
    <>
      <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
      <GithubOrgSelect session={session} />
      <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
      <GithubRepoSelect session={session} />
    </>
  )
}
