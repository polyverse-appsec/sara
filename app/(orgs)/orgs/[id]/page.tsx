'use client'

import React, { useEffect, useState } from 'react'

import { type OrgPartDeux } from './../../../../lib/data-model-types'
import { useAppContext } from './../../../../lib/hooks/app-context'

const OrgIndex = ({ params: { id } }: { params: { id: string } }) => {
  const { setActiveBillingOrg } = useAppContext()
  const [org, setOrg] = useState<OrgPartDeux | null>(null)

  useEffect(() => {
    ;(async () => {
      const res = await fetch(`/api/orgs/${id}`)

      if (!res.ok) {
        const errText = await res.text()

        throw new Error(
          `Failed to get a success response when fetching organization '${id}' because: ${errText}`,
        )
      }

      const fetchedOrg = await res.json()

      setOrg(fetchedOrg)
    })()
  }, [])

  if (!org) {
    return null
  }

  // Once we have loaded our data set the active billing org to it
  setActiveBillingOrg(org)

  return (
    <div className="flex-1 flex-col gap-4 p-10 text-2xl font-bold">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold">{org.name}</h3>
      </div>
    </div>
  )
}

export default OrgIndex
