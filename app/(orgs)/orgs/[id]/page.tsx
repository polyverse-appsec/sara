'use client'

import React, { useEffect, useState } from 'react'
import { SaraSession } from 'auth'
import { IconExternalLink } from 'components/ui/icons'
import { useSession } from 'next-auth/react'

import {
  UserOrgStatus,
  type OrgPartDeux,
} from './../../../../lib/data-model-types'
import { useAppContext } from './../../../../lib/hooks/app-context'

const getOrgUserStatus = async (
  orgId: string,
  userId: string,
): Promise<UserOrgStatus> => {
  const res = await fetch(`/api/orgs/${orgId}/users/${userId}/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const errText = await res.text()
    console.debug(`Failed to get User Status because: ${errText}`)

    throw new Error(`Failed to get user status`)
  }

  const userStatus = await res.json()
  return userStatus
}

const OrgIndex = ({ params: { id } }: { params: { id: string } }) => {
  const { setActiveBillingOrg } = useAppContext()
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
      <div className="bg-background shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold">{org.name}</h3>
      </div>
      {orgIsPremium ? (
        <div className="bg-background shadow-md rounded-lg p-6 mt-10">
          <h3 className="text-lg font-semibold">
            You have all premium plan permissions for this organization
          </h3>
        </div>
      ) : (
        <div className="bg-background shadow-md rounded-lg p-6 mt-10">
          <h3 className="text-lg font-semibold">
            You have basic plan permissions for this organization
          </h3>
          <button
            onClick={() =>
              window.open(
                'https://buy.stripe.com/8wM9AY9hAe4y5fa000',
                '_blank',
                'noopener,noreferrer',
              )
            }
            className="inline-flex items-center text-xs hover:bg-blue-300 transition duration-300 p-2 rounded"
          >
            Upgrade to Premium Subscription
            <IconExternalLink className="w-3 h-3 ml-2" />
          </button>
        </div>
      )}
    </div>
  )
}

export default OrgIndex
