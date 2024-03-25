'use client'

import React, { useState } from 'react'
import { ProjectPartDeux } from 'lib/data-model-types'

import { ProjectCreateTile } from './project-create-tile'
import { ProjectDetailsTile } from './project-details-tile'

interface ProjectDashboardProps {
  projects: ProjectPartDeux[]
  onDelete: () => void
}

const ProjectDashboard = ({ projects, onDelete }: ProjectDashboardProps) => {
  return (
    <div>
      <div className="mb-10">
        <ProjectCreateTile />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map(({ id, name, createdAt, lastUpdatedAt }) => (
          <ProjectDetailsTile
            key={id}
            id={id}
            name={name}
            createdAt={
              typeof createdAt === 'string'
                ? createdAt
                : createdAt.toDateString()
            }
            lastUpdatedAt={
              typeof lastUpdatedAt === 'string'
                ? lastUpdatedAt
                : lastUpdatedAt.toDateString()
            }
            refreshProjects={onDelete}
          />
        ))}
      </div>
    </div>
  )
}

export default ProjectDashboard
