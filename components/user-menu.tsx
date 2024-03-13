'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  ExclamationTriangleIcon,
  HamburgerMenuIcon,
} from '@radix-ui/react-icons'
import { type SaraSession } from 'auth'
import { UserOrgStatus } from 'lib/data-model-types'
import { useAppContext } from 'lib/hooks/app-context'
import { type Session } from 'next-auth'
import { signOut, useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

import LoadingCircle from './loading-spinner'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { IconExternalLink } from './ui/icons'

export interface UserMenuProps {
  user: Session['user']
}

function getUserInitials(name: string) {
  const [firstName, lastName] = name.split(' ')
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName.slice(0, 2)
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

const getOrgStatus = async (
  orgId: string,
  userId: string,
): Promise<UserOrgStatus> => {
  const res = await fetch(`/api/orgs/${orgId}/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const errText = await res.text()
    console.debug(`Failed to get org Status because: ${errText}`)

    throw new Error(`Failed to get org status`)
  }

  const orgStatus = await res.json()
  return orgStatus
}

export function UserMenu({ user }: UserMenuProps) {
  const { activeBillingOrg } = useAppContext()
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const [userGitHubAppInstalled, setUserGitHubAppInstalled] = useState<boolean>(true)
  const [orgGithubAppInstalled, setOrgGitHubAppInstalled] = useState<boolean>(true)
  const [userIsPremium, setUserIsPremium] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    const fetchUserStatus = async () => {
      try {
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

        const orgStatus = await getOrgStatus(
          activeBillingOrg.id,
          saraSession.id
        )

        setUserGitHubAppInstalled(orgUserStatus.gitHubAppInstalled === 'INSTALLED')
        setOrgGitHubAppInstalled(orgStatus.gitHubAppInstalled === 'INSTALLED')
        setUserIsPremium(orgUserStatus.isPremium === 'PREMIUM')
        if (isMounted) {
          setTimeout(fetchUserStatus, 5000)
        }
      } catch (error) {
        toast.error(`Failed to fetch user status: ${error}`)
        if (isMounted) {
          setTimeout(fetchUserStatus, 5000)
        }
      }
    }
    fetchUserStatus()

    return () => {
      isMounted = false
    }
  }, [activeBillingOrg, saraSession])

  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="pl-0">
            {!saraSession ? (
              <LoadingCircle />
            ) : saraSession.picture ? (
              <Image
                className="w-6 h-6 transition-opacity duration-300 rounded-full select-none ring-1 ring-zinc-100/10 hover:opacity-80"
                src={saraSession.picture ? `${saraSession.picture}&s=60` : ''}
                alt={saraSession.name ?? 'Avatar'}
                height={48}
                width={48}
              />
            ) : (
              <div className="flex items-center justify-center text-xs font-medium uppercase rounded-full select-none h-7 w-7 shrink-0 bg-muted/50 text-muted-foreground">
                {saraSession.name ? getUserInitials(saraSession.name) : null}
              </div>
            )}
            <span className="ml-2">{saraSession?.name}</span>
            <HamburgerMenuIcon className="ml-2 w-4 h-4" />
            {!userGitHubAppInstalled ? (
              <div title="The User GitHub App has not been installed.">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
              </div>
            ) : null}
            {!orgGithubAppInstalled ? (
              <div title="The Organization GitHub App has not been installed.">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
              </div>
            ) : null}
            {!userIsPremium ? (
              <div title="The User is not on a premium plan.">
                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
              </div>
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start" className="w-[180px]">
          <DropdownMenuItem className="flex-col items-start">
            <div className="text-xs font-medium">{saraSession?.name}</div>
            <div className="text-xs text-zinc-500">{saraSession?.email}</div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a
              href="https://billing.stripe.com/p/login/28o9DQ0uKf7o4OkaEE"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between w-full text-xs"
            >
              Account Management
              <IconExternalLink className="w-3 h-3 ml-auto" />
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <div>
              <a
                href="https://buy.stripe.com/8wM9AY9hAe4y5fa000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between w-full text-xs"
              >
                Upgrade to Premium Subscription
                <IconExternalLink className="w-3 h-3 ml-auto" />
              </a>
              {!userIsPremium ? (
                <div title="The User is not on a premium plan.">
                  <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                </div>
              ) : null}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <div>
              <a
                href="https://github.com/apps/polyverse-boost"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between w-full text-xs"
              >
                Authorize Private Repositories
                <IconExternalLink className="w-3 h-3 ml-auto" />
              </a>
              {!userGitHubAppInstalled ? (
                <div title="The User GitHub App has not been installed.">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                </div>
              ) : null}
              {!orgGithubAppInstalled ? (
                <div title="The Organization GitHub App has not been installed.">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                </div>
              ) : null}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              signOut({
                callbackUrl: '/',
              })
            }
            className="text-xs"
          >
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
