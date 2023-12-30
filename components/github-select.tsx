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
import { getOrganizations, getRepositories } from '@/app/actions'
import { useState, useEffect } from 'react';
import { Organization } from '@/lib/polyverse/github/repos'

interface GitHubSelectProps {
  session: Session; // Add the session prop
}

export function GithubSelect({ session }: GitHubSelectProps) {

    console.log('GithubSelect session:', session);
    // component implementation
    const user = session.user;

    // State to store organizations
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
    const [repositories, setRepositories] = useState<string[]>([]);
    const [selectedRepository, setSelectedRepository] = useState<string | null>(null);
  
    // State to track if dropdown is open
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
    const fetchOrganizations = () => {
      console.log('Fetching organizations')
      getOrganizations().then(data => {
        if (Array.isArray(data)) {
          setOrganizations(data);
        } else {
          console.error('Error fetching organizations:', data);
        }
      }).catch(error => {
        console.error('Error fetching organizations:', error);
      });
    };

    const fetchRepositories = (org: Organization) => {
      console.log('Fetching repositories for organization:', org);
      if (org) {
        getRepositories(org.login).then(data => {
          if (Array.isArray(data)) {
            setRepositories(data);
          } else {
            console.error('Error fetching repositories:', data);
          }
        }).catch(error => {
          console.error('Error fetching repositories:', error);
        });
      }
    }
  
    useEffect(() => {
      fetchOrganizations();
    }, []);

    const handleOrganizationChange = (org: Organization) => {
      console.log('Organization changed:', org);
      setSelectedOrganization(org);

      session.organization = org;
      // Reset repositories when organization changes
      fetchRepositories(org);
    };

    const handleRepositoryChange = (repo: string) => {
      console.log('Repository changed:', repo);
      setSelectedRepository(repo);

      session.repository = repo;
    }
  
  return (
    <>
      <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
      <GithubOrgSelect 
        session={session} 
        organizations={organizations}
        selectedOrganization={selectedOrganization}
        onOrganizationChange={handleOrganizationChange} />
      <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
      <GithubRepoSelect 
        session={session} 
        selectedRepository={selectedRepository} 
        repositories={repositories}
        onRepositoryChange={handleRepositoryChange}
        />
    </>
  )
}
