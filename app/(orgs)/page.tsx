'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from 'lib/hooks/app-context'

import OrgDashboard from './orgs/org-dashboard'

const IndexPage = () => {
  const router = useRouter()
  const { setActiveBillingOrg } = useAppContext()
  const [orgs, setOrgs] = useState([])
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true)
  const [isRedirectingToProjects, setIsRedirectingToProjects] = useState(false)

  useEffect(() => {
    ;(async () => {
      setIsRedirectingToProjects(false)
      const res = await fetch('/api/orgs')

      if (!res.ok) {
        const errText = await res.text()

        throw new Error(
          `Failed to get a success response when fetching organizations because: ${errText}`,
        )
      }
      setIsLoadingOrgs(false)
      setIsRedirectingToProjects(true)

      const fetchedOrgs = await res.json()

      setOrgs(fetchedOrgs)

      if (fetchedOrgs.length > 0) {
        setActiveBillingOrg(fetchedOrgs[0])
        router.push(`/projects`)
      }
    })()
  }, [setActiveBillingOrg, router])

  return (
    <div className="flex-1 p-10 text-2xl font-bold">
      <OrgDashboard orgs={orgs} />
      {isLoadingOrgs && (
        <div className="flex justify-center items-center">Loading orgs...</div>
      )}
      {isRedirectingToProjects && (
        <div className="flex justify-center items-center pt-20">
          Loading your Projects...
        </div>
      )}
    </div>
  )
}

export default IndexPage
