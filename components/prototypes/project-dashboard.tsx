'use client'

import React, { useState } from 'react'
import Link from 'next/link'

import { ProjectCreateTile } from './project-create-tile'
import { ProjectDetailsTile } from './project-details-tile'

const projects = [
  {
    id: '1',
    name: 'Project One',
    lastUpdatedAt: new Date('2023-04-01'),
    status: 'active',
  },
  {
    id: '2',
    name: 'Project Two',
    lastUpdatedAt: new Date('2023-04-01'),
    status: 'active',
  },
  {
    id: '3',
    name: 'Project Three',
    lastUpdatedAt: new Date('2023-04-01'),
    status: 'active',
  },
  {
    id: '4',
    name: 'Project Four',
    lastUpdatedAt: new Date('2023-04-01'),
    status: 'active',
  },
  {
    id: '5',
    name: 'Project Five',
    lastUpdatedAt: new Date('2023-04-01'),
    status: 'active',
  },
  {
    id: '6',
    name: 'Project Six',
    lastUpdatedAt: new Date('2023-04-01'),
    status: 'active',
  },
]

const ProjectDashboard = () => {
  // TODO: Or do I want to render a new page? Such as have a Link for ProjectCreateTile. Yes... See the notes from the ProjectCreation component
  const [renderProjectCreation, setRenderProjectCreation] =
    useState<boolean>(false)

  return (
    <div>
      <div className="mb-10">
        <ProjectCreateTile onClick={() => setRenderProjectCreation(true)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map(({ id, name, lastUpdatedAt }) => (
          <ProjectDetailsTile
            key={id}
            id={id}
            name={name}
            lastUpdatedAt={lastUpdatedAt}
          />
        ))}
      </div>
    </div>
  )
}

export default ProjectDashboard
