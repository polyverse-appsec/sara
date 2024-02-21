'use client'

import React from 'react'

import { OrgDetailsTile } from './org-details-tile'

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

interface OrgDashboardProps {
  orgs: any[]
}

const OrgDashboard = ({ orgs }: OrgDashboardProps) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orgs.map(({ login, avatar_url }) => (
          <OrgDetailsTile key={login} login={login} avatar_url={avatar_url} />
        ))}
      </div>
    </div>
  )
}

export default OrgDashboard
