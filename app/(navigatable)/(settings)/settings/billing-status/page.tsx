'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { OrgDetailsTile } from 'app/(navigatable)/(orgs)/orgs/org-details-tile'
import { getOrgUserStatus } from 'app/react-utils'
import { SaraSession } from 'auth'
import RenderableResourceContent from 'components/renderable-resource/renderable-resource-content'
import { IconExternalLink } from 'components/ui/icons'
import { useAppContext } from 'lib/hooks/app-context'
import { useSession } from 'next-auth/react'

const SettingsOrgUpgrade = () => {
  const { activeBillingOrg } = useAppContext()
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const [orgIsPremium, setOrgIsPremium] = useState<boolean>(true)
  const [orgs, setOrgs] = useState([])

  useEffect(() => {
    ;(async () => {
      if (!activeBillingOrg) {
        return
      }

      if (!saraSession) {
        return
      }

      const orgUserStatus = await getOrgUserStatus(
        activeBillingOrg.id,
        saraSession.id,
      )

      setOrgIsPremium(orgUserStatus.isPremium === 'PREMIUM')

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
    <div className="flex flex-col items-center p-10">
      <p className="text-2xl font-bold">Billing Status</p>
      <div className="w-1/2 border-t-2 border-blue-600 my-2"></div>
      {activeBillingOrg ? (
        <p className="m-4 font-semibold">
          Your current billing org is {activeBillingOrg.name}{' '}
        </p>
      ) : (
        <p className="m-4 font-semibold">No selected billing org</p>
      )}
      <RenderableResourceContent>
        {orgIsPremium ? (
          <p className="text-md font-bold text-green-600 mb-2">
            User {saraSession?.name} on {activeBillingOrg?.name} is on the premium plan
          </p>
        ) : (
          <p className="text-md font-bold mb-2">
            User {saraSession?.name} on {activeBillingOrg?.name} is on the free plan
          </p>
        )}
        <Link
          href="https://billing.stripe.com/p/login/28o9DQ0uKf7o4OkaEE"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-between w-full text-sm"
        >
          <div className="flex justify-between items-center w-full font-semibold bg-white-600 shadow-md rounded-lg p-2 transform transition hover:scale-105 cursor-pointer">
            <p>Manage Billing Plan</p>
            <IconExternalLink className="w-4 h-4 ml-auto" />
          </div>
        </Link>
        <p className="text-xs text-blue-600 mt-2">
          Note, this will redirect you to Stripe
        </p>
      </RenderableResourceContent>
      <RenderableResourceContent>
        <div className="flex items-center">
          <div className={!orgIsPremium ? "bg-background shadow-md rounded-lg p-6 border-2 border-orange-500 mb-4" : "bg-background shadow-md rounded-lg p-6 border mb-4"}>
            <div className="flex flex-col items-start">
              <p>Free Plan</p>
              <p>❌ Project creation limit</p>
              <p>❌ Only public respositories for projects</p>
            </div>
          </div>
          <div className={orgIsPremium ? "bg-background shadow-md rounded-lg p-6 border-2 border-orange-500 mb-4" : "bg-background shadow-md rounded-lg p-6 border mb-4"}>
            <div className="flex flex-col items-start">
              <p>Premium Plan</p>
              <p>✅ Unlimited project creation</p>
              <p>✅ Access to private repositories for projects</p>
            </div>
          </div>
        </div>
        {orgIsPremium ? (
          <div className="inline-flex items-center justify-between w-full text-sm">
            <div className="flex justify-between items-center w-full font-semibold bg-white-600 shadow-md rounded-lg p-2 cursor-not-allowed opacity-50">
              <p>You are already on premium plan for {activeBillingOrg?.name}</p>
              <IconExternalLink className="w-4 h-4 ml-auto" />
            </div>
          </div>
        ) : (
          <Link
            href="https://buy.stripe.com/8wM9AY9hAe4y5fa000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-between w-full text-sm"
          >
            <div className="flex justify-between items-center w-full font-semibold bg-white-600 shadow-md rounded-lg p-2 transform transition hover:scale-105 cursor-pointer">
              <p>Upgrade to premium plan for {activeBillingOrg?.name}</p>
              <IconExternalLink className="w-4 h-4 ml-auto" />
            </div>
          </Link>
        )}
        <p className="text-xs text-blue-600 mt-2">
          Note, this will redirect you to Stripe
        </p>
      </RenderableResourceContent>
    </div>
  )
}

export default SettingsOrgUpgrade
