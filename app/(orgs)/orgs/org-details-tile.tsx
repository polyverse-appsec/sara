'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { SaraSession } from 'auth'
import { UserOrgStatus } from 'lib/data-model-types'
import toast from 'react-hot-toast'
import { StarFilledIcon } from '@radix-ui/react-icons'
import { useAppContext } from 'lib/hooks/app-context'

interface OrgDetailsTileProps {
  name: string
  id: string
}

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


export const OrgDetailsTile = ({ name, id }: OrgDetailsTileProps) => {
  const { activeBillingOrg } = useAppContext()
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const[ orgIsPremium, setOrgIsPremium ] = useState(false)

  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        if (!saraSession) {
          return
        }

        const orgUserStatus = await getOrgUserStatus(
          id,
          saraSession.id,
        )

        setOrgIsPremium(orgUserStatus.isPremium === 'PREMIUM')

      } catch (error) {
        toast.error(`Failed to fetch user status: ${error}`)
      }
    }

    fetchUserStatus()
  }, [activeBillingOrg])


  return (
    <Link
      href={`/orgs/${id}`}
      className="block transform transition hover:scale-105"
    >
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-center text-xs font-medium uppercase rounded-full select-none h-7 w-7 shrink-0 bg-muted/50 text-muted-foreground">
          {name.slice(0, 2)}
        </div>
        <div className="flex justify-between">
          <h3 className="text-lg font-semibold">{name}</h3>
          { orgIsPremium ? 
          <div title="Premium Plan" className="ml-1">
            <div className="p-1 border border-yellow-500 rounded-full">
              <StarFilledIcon className="w-3 h-3 text-yellow-500" /> 
            </div>
          </div> : null }
        </div>
      </div>
    </Link>
  )
}
