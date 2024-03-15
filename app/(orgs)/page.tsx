'use client'

import { useEffect, useState } from 'react'

import OrgDashboard from './orgs/org-dashboard'
import { useRouter } from 'next/navigation'

const IndexPage = () => {
  const router = useRouter()
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

      if (fetchedOrgs.length > 0) {
        router.push(`/orgs/${fetchedOrgs[0].id}`)
      }
    })()
  }, [])

  return (
    <div className="flex-1 p-10 text-2xl font-bold">
      <OrgDashboard orgs={orgs} />
    </div>
  )
}

export default IndexPage
