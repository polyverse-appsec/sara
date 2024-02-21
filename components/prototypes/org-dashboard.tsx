'use client'

import React, { useEffect } from 'react'

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

const OrgDashboard = () => {
  useEffect(() => {})

  return (
    <div>
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

export default OrgDashboard
