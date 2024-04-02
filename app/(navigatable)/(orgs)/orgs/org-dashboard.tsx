'use client'

import React from 'react'

import { type Org } from './../../../../lib/data-model-types'
import { OrgCreateTile } from './org-create-tile'
import { OrgDetailsTile } from './org-details-tile'

interface OrgDashboardProps {
  orgs: Org[]
}

const OrgDashboard = ({ orgs }: OrgDashboardProps) => {
  return (
    <div>
      <div className="text-center mb-2">Billing Contexts</div>
      <div className="flex justify-center w-full">
        <div className="w-1/2 border-t-2 border-blue-600 mb-5"></div>
      </div>
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
