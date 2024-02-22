'use client'

import React from 'react'
import { Assistant } from 'openai/resources/beta/assistants/assistants'

import {
  type Organization,
  type Project,
  type User,
} from './../lib/data-model-types'
import {
  useAppContext,
  type SaraOrganization,
  type SaraProject,
} from './../lib/hooks/app-context'
import { formatDateForLastSynchronizedAt } from './../lib/utils'
import { OrganizationSelector } from './organization-selector'
import { ProjectCreationManager } from './project-creation-manager'
import { ProjectDeletionManager } from './project-deletion-manager'
import { ProjectSelector } from './project-selector'
import { Button } from './ui/button'
import { IconSeparator } from './ui/icons'

const renderOrganizationSelector = (
  user: User | null,
  handleOrganizationChange: (org: Organization) => void,
) => {
  if (!user) {
    return null
  }

  return (
    <>
      <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
      <OrganizationSelector
        user={user}
        onOrganizationChanged={handleOrganizationChange}
      />
    </>
  )
}

const renderProjectSelector = (
  user: User | null,
  org: Organization | null,
  initialProject: Project | null,
  handleProjectChange: (project: Project) => void,
) => {
  if (!user || !org || !org.login) {
    return null
  }

  return (
    <>
      <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
      <ProjectSelector
        initialProject={initialProject}
        org={org}
        onProjectChanged={handleProjectChange}
        user={user}
      />
    </>
  )
}

const renderConfigProjectButton = () => {
  return (
    <Button variant="ghost">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
      <div className="ml-1">Configure</div>
    </Button>
  )
}

const renderProjectDeletionManager = (
  user: User | null,
  org: Organization | null,
  project: SaraProject | null,
  onProjectDeleted: (projectName: string) => void,
) => {
  if (!user || !org || !org.login || !project) {
    return null
  }

  return (
    <ProjectDeletionManager
      org={org}
      project={project}
      user={user}
      onProjectDeleted={onProjectDeleted}
    />
  )
}

const renderProjectCreationManager = (
  user: User | null,
  org: Organization | null,
  onProjectCreated: (project: Project, assistant: Assistant) => void,
) => {
  if (!user || !org || !org.login) {
    return null
  }

  return (
    <ProjectCreationManager
      user={user}
      org={org}
      onProjectCreated={onProjectCreated}
    />
  )
}

// TODO: Work items to make functional
// * Pass a onProjectChange handler to <ProjectSelector>
// * Handle all of the other logic from GitHubSelect for on repo change
// * Query for repos that are assocaited with the Project
// * Add widget for creating a new project
// * Add widget for configuring a selected project
// * Review all of the synchronization states for the UI chat

export const ProjectManager = () => {
  const {
    user,
    saraConfig: { orgConfig, projectConfig },
    setOrgConfig,
    setProjectConfig,
  } = useAppContext()
  const handleOrganizationChange = (org: Organization) => {
    console.debug(`Organization changed to: ${org.login}`)

    // TODO: Probbly need a helper method to build the status, statusInfo, and errorInfo and default to errorInfo being null
    orgConfig.organization = org as SaraOrganization
    orgConfig.status = 'CONFIGURING'
    orgConfig.statusInfo = 'Discovering Repositories'
    orgConfig.errorInfo = null
    setOrgConfig(orgConfig)
  }

  const handleProjectChange = async (project: Project) => {
    console.debug(`Project changed to: ${project.name}`)

    // TODO: Probbly need a helper method to build the status, statusInfo, and errorInfo and default to errorInfo being null
    projectConfig.project = project as SaraProject
    projectConfig.status = 'CONFIGURED'
    projectConfig.statusInfo = 'Project Data Discovered'
    projectConfig.errorInfo = null
    setProjectConfig(projectConfig)
  }

  const handleProjectDeletion = (projectName: string) => {
    console.debug(`Project deleted: ${projectName}`)

    projectConfig.project = null
    projectConfig.status = 'UNCONFIGURED'
    projectConfig.statusInfo = ''
    projectConfig.errorInfo = null

    setProjectConfig(projectConfig)
  }

  const handleProjectCreation = async (
    project: Project,
    assistant: Assistant,
  ) => {
    console.debug(`Project created: ${project.name}`)

    const lastSynchronizedAt = new Date()

    // TODO: Probbly need a helper method to build the status, statusInfo, and errorInfo and default to errorInfo being null
    projectConfig.project = project as SaraProject
    projectConfig.project.assistant = assistant
    projectConfig.project.lastSynchronizedAt = lastSynchronizedAt
    projectConfig.status = 'CONFIGURED'
    projectConfig.statusInfo = `Synchronized Last: ${formatDateForLastSynchronizedAt(
      lastSynchronizedAt,
    )}`
    projectConfig.errorInfo = null
    setProjectConfig(projectConfig)
  }

  // TODO: Refactor organization to org
  const { organization: org } = orgConfig
  const { project } = projectConfig

  // TODO: We aren't rendering project configuration until the backend supports multi-tier apps

  return (
    <>
      {renderOrganizationSelector(user, handleOrganizationChange)}
      {renderProjectSelector(user, org, project, handleProjectChange)}
      {/*renderConfigProjectButton()*/}
      {renderProjectDeletionManager(user, org, project, handleProjectDeletion)}
      {renderProjectCreationManager(user, org, handleProjectCreation)}
    </>
  )
}
