'use client'

import React from 'react'

import { OrgDetailsTile } from './org-details-tile'

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
