'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, StarFilledIcon } from '@radix-ui/react-icons'
import { Flex } from '@radix-ui/themes'
import { getOrgUserStatus } from 'app/react-utils'
import { SaraSession } from 'auth'
import RenderableResourceContent from 'components/renderable-resource/renderable-resource-content'
import { IconExternalLink } from 'components/ui/icons'
import { useAppContext } from 'lib/hooks/app-context'
import { preReleaseServiceDisclaimer } from 'lib/productDescriptions'
import { isPreviewFeatureEnabled } from 'lib/service-utils'
import { useSession } from 'next-auth/react'
import { PremiumPlanUIDescription } from 'components/product-descriptions'

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
  }, [activeBillingOrg, saraSession])

  return (
    <div className="flex flex-col items-center pt-10 px-10">
      <div className="flex items-left text-left mb-2 w-full">
        <button className="btn-blue text-sm">
          <Link href="/settings">
            <Flex align="center">
              <ArrowLeftIcon className="mr-2" />
              Back to Settings
            </Flex>
          </Link>
        </button>
      </div>
      <RenderableResourceContent>
        <p className="text-2xl font-bold px-72">Billing Status</p>
      </RenderableResourceContent>
      {activeBillingOrg ? (
        <p className="m-4 font-semibold">
          Your current billing context is {activeBillingOrg.name}{' '}
        </p>
      ) : (
        <p className="m-4 font-semibold">No selected billing context</p>
      )}
      <RenderableResourceContent>
        {orgIsPremium ? (
          <p className="text-md font-bold text-green-600 mb-2">
            User {saraSession?.name} on {activeBillingOrg?.name} is on the
            Premium Plan monthly subscription
          </p>
        ) : (
          <p className="text-md font-bold mb-2">
            User {saraSession?.name} on {activeBillingOrg?.name} is on the Free
            Trial monthly plan
          </p>
        )}
        <Link
          href="https://billing.stripe.com/p/login/28o9DQ0uKf7o4OkaEE"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-between w-full text-sm"
        >
          <div className="flex justify-between items-center w-full font-semibold bg-white-600 shadow-md rounded-lg p-2 transition hover:scale-105 cursor-pointer">
            <p>Manage Billing Plan</p>
            <IconExternalLink className="w-4 h-4 ml-auto" />
          </div>
        </Link>
        <p className="text-xs text-blue-600 mt-2">
          Note, this will redirect you to Stripe.com website for secure billing
          and account information.
        </p>
      </RenderableResourceContent>
      <RenderableResourceContent>
        <div className="flex items-center justify-center">
          {isPreviewFeatureEnabled('FreePlanEnabled') && (
            <div
              className={
                !orgIsPremium
                  ? 'bg-background shadow-md rounded-lg p-6 border-2 border-orange-500 mb-4'
                  : 'bg-background shadow-md rounded-lg p-6 border mb-4'
              }
            >
              <div className="flex flex-col items-start">
                <p>Free Plan</p>
                <p>✅ Project creation to analyze GitHub repositories</p>
                <p>✅ Project Goals can be set to guide Sara analysis</p>
                <p>✅ Sara generated Task-plans to achieve Goals</p>
                <p>✅ Manual GitHub source synchronization</p>
                <p>❌ Project creation limit</p>
                <p>❌ Only public respositories for projects</p>
              </div>
            </div>
          )}
          <div
            className={
              orgIsPremium
                ? 'bg-background shadow-md rounded-lg p-6 border-2 border-orange-500 mb-4'
                : 'bg-background shadow-md rounded-lg p-6 border mb-4'
            }
          >
            <PremiumPlanUIDescription />
          </div>
        </div>
        <div className="py-1 px-2 rounded-lg text-center text-orange-400 bg-orange-200">
          {preReleaseServiceDisclaimer}
        </div>
        {orgIsPremium ? (
          <div className="inline-flex items-center justify-between w-full text-sm">
            <div className="flex justify-between items-center w-full font-semibold bg-white-600 shadow-md rounded-lg p-2 cursor-not-allowed opacity-50">
              <p>
                You are already subscribed to Premium Plan for{' '}
                {activeBillingOrg?.name}
              </p>
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
            <div className="flex justify-between items-center w-full font-semibold bg-white-600 shadow-md rounded-lg p-2 transition hover:scale-105 cursor-pointer">
              <p>
                Upgrade to Premium Plan monthly subscription for{' '}
                {activeBillingOrg?.name}
              </p>
              <IconExternalLink className="w-4 h-4 ml-auto" />
              <p className="text-xs text-blue-600 mt-2">
                Note, this will redirect you to Stripe.com website for secure
                billing and account information.
              </p>
            </div>
          </Link>
        )}
      </RenderableResourceContent>
    </div>
  )
}

export default SettingsOrgUpgrade
