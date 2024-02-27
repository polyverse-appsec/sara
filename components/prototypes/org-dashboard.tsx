'use client'

import React from 'react'

import { type OrgPartDeux } from './../../lib/data-model-types'
import { OrgCreateTile } from './org-create-tile'
import { OrgDetailsTile } from './org-details-tile'

interface OrgDashboardProps {
  orgs: OrgPartDeux[]
}

const OrgDashboard = ({ orgs }: OrgDashboardProps) => {
  return (
    <div>
      <div className="mb-10">
        <OrgCreateTile />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orgs.map(({ name, id }) => (
          <OrgDetailsTile key={id} name={name} id={id} />
        ))}
      </div>
    </div>
  )
}

export default OrgDashboard
