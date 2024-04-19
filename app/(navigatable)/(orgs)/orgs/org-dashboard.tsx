'use client'

import React from 'react'
import RenderableResourceContent from 'components/renderable-resource/renderable-resource-content'

import { type Org } from './../../../../lib/data-model-types'
import { OrgCreateTile } from './org-create-tile'
import { OrgDetailsTile } from './org-details-tile'

interface OrgDashboardProps {
  orgs: Org[]
}

const OrgDashboard = ({ orgs }: OrgDashboardProps) => {
  return (
    <div>
      <RenderableResourceContent>
        <div className="text-center mb-2">Billing Contexts</div>
      </RenderableResourceContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orgs.map(({ name, id }) => (
          <OrgDetailsTile key={id} name={name} id={id} />
        ))}
        <div className="flex items-center justify-center">
          <div className="w-1/2 mb-10">
            <OrgCreateTile />
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrgDashboard
