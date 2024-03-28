'use client'

import React, { useEffect, useState } from 'react'
import { getOrgUserStatus } from 'app/react-utils'
import { SaraSession } from 'auth'
import { IconExternalLink } from 'components/ui/icons'
import { useSession } from 'next-auth/react'

import {
  UserOrgStatus,
  type OrgPartDeux,
} from './../../../../../lib/data-model-types'
import { useAppContext } from './../../../../../lib/hooks/app-context'
import RenderableResourceContent from 'components/renderable-resource/renderable-resource-content'
import Link from 'next/link'

const OrgIndex = ({ params: { id } }: { params: { id: string } }) => {
  const { activeBillingOrg, setActiveBillingOrg } = useAppContext()
  const [org, setOrg] = useState<OrgPartDeux | null>(null)

  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const [orgIsPremium, setOrgIsPremium] = useState(false)

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
    })()
  }, [id, saraSession])

  if (!org) {
    return null
  }

  // Once we have loaded our data set the active billing org to it
  setActiveBillingOrg(org)

  return (
    <div className="flex-1 flex-col gap-4 p-10 text-2xl font-bold">
      <RenderableResourceContent>
        <div className="flex flex-col items-center">
          <h3>Current User Context</h3>
          <div className="w-1/2 border-t-2 border-blue-600 my-2"></div>
          <p className="text-lg">{org.name}</p>
        </div>
      </RenderableResourceContent>
      {orgIsPremium ? (
        <div className="bg-background shadow-md rounded-lg p-6 my-10">
          <h3 className="text-lg font-semibold text-center">
            You have all premium plan permissions for this organization
          </h3>
        </div>
      ) : (
        <div className="bg-background shadow-md rounded-lg p-6 my-10">
          <h3 className="text-lg font-semibold text-center">
            You have basic plan permissions for this organization
          </h3>
        </div>
      )}
      <RenderableResourceContent>
        <div className="flex items-center justify-between px-20 text-lg">
          <div
            className={
              !orgIsPremium
                ? 'bg-background shadow-md rounded-lg p-6 border-2 border-orange-500 mb-4'
                : 'bg-background shadow-md rounded-lg p-6 border mb-4'
            }
          >
            <div className="flex flex-col items-start">
              <p>Free Plan</p>
              <p>❌ Project creation limit</p>
              <p>❌ Only public respositories for projects</p>
            </div>
          </div>
          <div
            className={
              orgIsPremium
                ? 'bg-background shadow-md rounded-lg p-6 border-2 border-orange-500 mb-4'
                : 'bg-background shadow-md rounded-lg p-6 border mb-4'
            }
          >
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
              <p>
                You are already on premium plan for {activeBillingOrg?.name}
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

export default OrgIndex
