'use client'

import React from 'react'

import { type Organization, type User } from './../lib/data-model-types'
import { useAppContext } from './../lib/hooks/app-context'
import { OrganizationSelector } from './organization-selector'
import { ProjectSelector } from './project-selector'
import { IconSeparator } from './ui/icons'

const renderOrganizationSelector = (user: User | null) => {
  if (!user) {
    return null
  }

  return <OrganizationSelector user={user} />
}

const renderProjectSelector = (user: User | null, org: Organization | null) => {
  if (!user || !org || !org.login) {
    return null
  }

  return (
    <>
      <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
      <ProjectSelector user={user} org={org} />
    </>
  )
}

export const ProjectManager = () => {
  const {
    user,
    saraConfig: {
      orgConfig: { organization },
    },
  } = useAppContext()

  return (
    <>
      <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
      {renderOrganizationSelector(user)}
      {renderProjectSelector(user, organization)}
    </>
  )
}
