'use client'

import Image from 'next/image'
import { HamburgerMenuIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { type Session } from 'next-auth'
import { signOut } from 'next-auth/react'

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
import { UserOrgStatus } from 'lib/data-model-types'
import { useEffect, useState } from 'react'
import { useAppContext } from 'lib/hooks/app-context'
import toast from 'react-hot-toast'

export interface UserMenuProps {
  user: Session['user']
}

function getUserInitials(name: string) {
  const [firstName, lastName] = name.split(' ')
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName.slice(0, 2)
}

const getUserStatus = async (
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


export function UserMenu({ user }: UserMenuProps) {
  const isLoading = !user?.image || !user?.name
  const { activeBillingOrg } = useAppContext()

  const [githubAppInstalled, setGithubAppInstalled] = useState<boolean>(true)
  const [userIsPremium, setUserIsPremium] = useState<boolean>(true)
  
  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        if (!activeBillingOrg) {
          return
        }

        const userStatus = await getUserStatus(
          activeBillingOrg.id,
          user?.id ?? '',
        )


        setGithubAppInstalled(userStatus.gitHubAppInstalled === 'INSTALLED')

        setUserIsPremium(userStatus.isPremium === 'PREMIUM')
      } catch (error) {
        toast.error(`Failed to fetch user status: ${error}`)
      }
    }
    fetchUserStatus()
  }, [activeBillingOrg]) // Depend on activeBillingOrg.id to refetch if it changes

  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="pl-0">
            {isLoading ? (
              <LoadingCircle />
            ) : user?.image ? (
              <Image
                className="w-6 h-6 transition-opacity duration-300 rounded-full select-none ring-1 ring-zinc-100/10 hover:opacity-80"
                src={user?.image ? `${user.image}&s=60` : ''}
                alt={user.name ?? 'Avatar'}
                height={48}
                width={48}
              />
            ) : (
              <div className="flex items-center justify-center text-xs font-medium uppercase rounded-full select-none h-7 w-7 shrink-0 bg-muted/50 text-muted-foreground">
                {user?.name ? getUserInitials(user?.name) : null}
              </div>
            )}
            <span className="ml-2">{user?.name}</span>
            <HamburgerMenuIcon className="ml-2 w-4 h-4" />
            { !githubAppInstalled ?  
              <div title="The User GitHub App has not been installed.">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500"/>
              </div> 
            : null }
            { !userIsPremium ?
              <div title="The User is not on a premium plan.">
                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500"/>
              </div>
            : null }
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start" className="w-[180px]">
          <DropdownMenuItem className="flex-col items-start">
            <div className="text-xs font-medium">{user?.name}</div>
            <div className="text-xs text-zinc-500">{user?.email}</div>
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
              { !userIsPremium ?
              <div title="The User is not on a premium plan.">
                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500"/>
              </div>
            : null }
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
              { !githubAppInstalled ?  
                <div title="The User GitHub App has not been installed.">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-500"/>
                </div> 
              : null }
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
