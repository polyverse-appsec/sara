'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { StarFilledIcon } from '@radix-ui/react-icons'
import { Badge } from '@radix-ui/themes'
import { getOrgUserStatus } from 'app/react-utils'
import { SaraSession } from 'auth'
import { UserOrgStatus } from 'lib/data-model-types'
import { useAppContext } from 'lib/hooks/app-context'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface OrgDetailsTileProps {
  name: string
  id: string
}

export const OrgDetailsTile = ({ name, id }: OrgDetailsTileProps) => {
  const { activeBillingOrg } = useAppContext()
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const [orgIsPremium, setOrgIsPremium] = useState(false)
  const [orgIsSelected, setOrgIsSelected] = useState(false)
  const [orgIsPersonal, setOrgIsPersonal] = useState(false)

  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        if (!activeBillingOrg) {
          return
        }

        if (!saraSession) {
          return
        }

        const orgUserStatus = await getOrgUserStatus(id, saraSession.id)

        setOrgIsPremium(orgUserStatus.isPremium === 'PREMIUM')

        setOrgIsSelected(activeBillingOrg.id === id)
      } catch (error) {
        toast.error(`Failed to fetch user status: ${error}`)
      }
    }

    setOrgIsPersonal(name === saraSession?.username)

    fetchUserStatus()
  }, [activeBillingOrg, id, name, saraSession])

  return (
    <Link
      href={`/orgs/${id}`}
      className="block transition hover:scale-105"
    >
      <div className="bg-background shadow-md rounded-lg p-6 border border-blue-500">
        <div className="flex justify-between">
          <div className="flex flex-col">
            <div className="flex items-center justify-center text-xs font-medium uppercase rounded-full select-none h-7 w-7 shrink-0 bg-muted/50 text-muted-foreground">
              {name.slice(0, 2)}
            </div>
            <h3 className="text-lg font-semibold">{name}</h3>
            <div className="inline-flex">
              {orgIsPersonal ? (
                <Badge color="orange">Personal</Badge>
              ) : (
                <Badge color="orange">Business</Badge>
              )}
            </div>
            {orgIsSelected && (
              <p className="text-xs text-blue-600 mt-2">Active</p>
            )}
          </div>
          {orgIsPremium ? (
            <div className="flex flex-col items-center">
              <div title="Premium Plan" className="ml-1">
                <div className="p-1 border border-yellow-500 rounded-full">
                  <StarFilledIcon className="w-3 h-3 text-yellow-500" />
                </div>
              </div>
              <Badge color="green" className="mt-2">
                Premium
              </Badge>
            </div>
          ) : (
            <Badge color="gray">Free</Badge>
          )}
        </div>
      </div>
    </Link>
  )
}
