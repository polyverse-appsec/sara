'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SaraLoading from 'components/sara-loading'
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

      const fetchedOrgs = await res.json()

      setOrgs(fetchedOrgs)

      if (fetchedOrgs.length == 0) {
        router.push(`/orgs/create`)
      }

      setIsLoadingOrgs(false)

      if (fetchedOrgs.length > 0) {
        setIsRedirectingToProjects(true)
        setActiveBillingOrg(fetchedOrgs[0])
        router.push(`/projects`)
      }
    })()
  }, [setActiveBillingOrg, router])

  return (
    <div className="flex-1 p-10 text-2xl font-bold">
      <OrgDashboard orgs={orgs} />
      {isLoadingOrgs && (
        <SaraLoading message="Sara is refreshing your account..." />
      )}
      {isRedirectingToProjects && (
        <SaraLoading message="Sara is refreshing your projects..." />
      )}
    </div>
  )
}

export default IndexPage
