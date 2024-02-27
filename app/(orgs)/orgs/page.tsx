'use client'

import { useEffect, useState } from 'react'

import OrgDashboard from './../../../components/prototypes/org-dashboard'

const OrgsIndex = () => {
  const [orgs, setOrgs] = useState([])

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/orgs')

      if (!res.ok) {
        const errText = await res.text()

        throw new Error(
          `Failed to get a success response when fetching organizations because: ${errText}`,
        )
      }

      const fetchedOrgs = await res.json()

      setOrgs(fetchedOrgs)
    })()
  }, [])

  return (
    <div className="flex-1 p-10 text-2xl font-bold">
      <OrgDashboard orgs={orgs} />
    </div>
  )
}

export default OrgsIndex
