'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, StarFilledIcon } from '@radix-ui/react-icons'
import { Badge, Flex } from '@radix-ui/themes'
import { getOrgUserStatus } from 'app/react-utils'
import { SaraSession } from 'auth'
import RenderableResourceContent from 'components/renderable-resource/renderable-resource-content'
import SaraLoading from 'components/sara-loading'
import { IconExternalLink } from 'components/ui/icons'
import { isPreviewFeatureEnabled } from 'lib/service-utils'
import { useSession } from 'next-auth/react'

import { type Org } from './../../../../../lib/data-model-types'
import { useAppContext } from './../../../../../lib/hooks/app-context'
import { PremiumPlanUIDescription } from 'components/product-descriptions'

const OrgIndex = ({ params: { id } }: { params: { id: string } }) => {
  const { activeBillingOrg, setActiveBillingOrg } = useAppContext()
  const [org, setOrg] = useState<Org | null>(null)

  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const [orgIsPremium, setOrgIsPremium] = useState(false)
  const [orgIsPersonal, setOrgIsPersonal] = useState(false)

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

      // logic for checking if org is premium begins here
      if (!saraSession) {
        return
      }

      const orgUserStatus = await getOrgUserStatus(id, saraSession.id)

      setOrgIsPremium(orgUserStatus.isPremium === 'PREMIUM')

      setOrgIsPersonal(fetchedOrg.name === saraSession.username)
    })()
  }, [id, saraSession])

  if (!org) {
    return <SaraLoading />
  }

  // Once we have loaded our data set the active billing context to it
  setActiveBillingOrg(org)

  return (
    <div className="flex-1 flex-col gap-4 p-10 text-2xl font-bold">
      <div className="text-left mb-2">
        <button className="btn-blue text-sm">
          <Link href="/orgs">
            <Flex align="center">
              <ArrowLeftIcon className="mr-2" />
              Back to Billing Contexts
            </Flex>
          </Link>
        </button>
      </div>
      <RenderableResourceContent>
        <div className="flex flex-col items-center">
          <h3>Current Billing Context</h3>
          <div className="w-1/2 border-t-2 border-blue-600 my-2"></div>
          <p className="text-lg">{org.name}</p>
          {orgIsPersonal ? (
            <Badge color="orange">Personal</Badge>
          ) : (
            <Badge color="orange">Business</Badge>
          )}
        </div>
      </RenderableResourceContent>
      {orgIsPremium ? (
        <div className="flex items-center justify-center bg-background shadow-md rounded-lg p-6 my-10">
          <div
            title="Premium Plan"
            className="flex items-center justify-center mr-2 p-1 border border-yellow-500 rounded-full"
          >
            <StarFilledIcon className="w-2 h-2 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold text-center">
            Your Account is currently subscribed at the Premium Plan level with
            supported features noted below.
          </h3>
        </div>
      ) : (
        <div className="bg-background shadow-md rounded-lg p-6 my-10">
          {isPreviewFeatureEnabled('FreePlanEnabled') ? (
            <h3 className="text-lg font-semibold text-center">
              Your Account is currently a Free Subscription with supported
              features noted below.
            </h3>
          ) : (
            <h3 className="text-lg font-semibold text-center">
              Your Account has no current subscription. Please activate Premium
              Plan to enable Sara, Project Creation, and Goals/Task Analysis.
            </h3>
          )}
        </div>
      )}
      <RenderableResourceContent>
        <div className="flex items-center justify-center px-20 text-lg">
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
                <p>❌ Projects limited to 5 per account</p>
                <p>
                  ❌ GitHub repositories limited to public repositories only
                </p>
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
        {orgIsPremium ? (
          <div className="inline-flex items-center justify-center w-full text-sm">
            <div className="flex justify-between items-center w-1/2 font-semibold bg-white-600 shadow-md rounded-lg p-2 cursor-not-allowed opacity-50">
              <p>
                You are already subscribed to Premium Plan for{' '}
                {activeBillingOrg?.name}
              </p>
              <IconExternalLink className="w-4 h-4 ml-auto" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Link
              href="https://buy.stripe.com/8wM9AY9hAe4y5fa000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between w-1/2 text-sm"
            >
              <div className="flex justify-between items-center w-full font-semibold bg-white-600 shadow-md rounded-lg p-2 transition hover:border border-black dark:border-white hover:scale-105 cursor-pointer">
                <p>Upgrade to Premium Plan for {activeBillingOrg?.name}</p>
                <IconExternalLink className="w-4 h-4 ml-auto" />
              </div>
            </Link>
            <p className="text-xs text-blue-600 mt-2">
              Note, this will redirect you to the Stripe.com website for secure
              billing and account information.
            </p>
          </div>
        )}
      </RenderableResourceContent>
    </div>
  )
}

export default OrgIndex
