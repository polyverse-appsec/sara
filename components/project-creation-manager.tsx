'use client'

import React, { useEffect, useState } from 'react'
import { Assistant } from 'openai/resources/beta/assistants/assistants'
import toast from 'react-hot-toast'

import {
  type Organization,
  type Project,
  type Repository,
  type User,
} from '../lib/data-model-types'
import { getRepositoriesForOrg } from './../app/_actions/get-repositories-for-org'
import { ProjectCreationDialog } from './project-creation-dialog'
import { Button } from './ui/button'

interface ProjectCreationManagerProps {
  user: User
  org: Organization
  onProjectCreated: (project: Project, assistant: Assistant) => void
}

// TODO: For completion
// * Hook up button to provide the open/closed state of the dialog (useState locally)
export const ProjectCreationManager = ({
  user,
  org,
  onProjectCreated,
}: ProjectCreationManagerProps) => {
  // TODO: need to change this when a project is created
  const [renderCreationDialog, setRenderCreationDialog] =
    useState<boolean>(false)

  const [repos, setRepos] = useState<Repository[]>([])

  useEffect(() => {
    fetchRepositories(org)
  }, [org])

  const fetchRepositories = async (org: Organization) => {
    try {
      const repos = await getRepositoriesForOrg(org.login)
      console.debug(`Repositories fetched for organization: ${org.login}`)

      setRepos(repos)
    } catch (err) {
      const errMsg = `Error fetching repositories for org '${org.login}'`
      console.error(`${errMsg}: ${err}`)

      toast.error(`${errMsg} - please switch organizations and back`)
    }
  }

  return (
    <>
      <Button variant="ghost" onClick={() => setRenderCreationDialog(true)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        <div className="ml-1">Create New Project</div>
      </Button>
      <ProjectCreationDialog
        user={user}
        open={renderCreationDialog}
        repos={repos}
        onDialogClosed={() => setRenderCreationDialog(false)}
        onProjectCreated={(project, assistant) => {
          setRenderCreationDialog(false)
          onProjectCreated(project, assistant)
        }}
      />
    </>
  )
}
