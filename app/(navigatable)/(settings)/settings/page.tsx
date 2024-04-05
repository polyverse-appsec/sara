'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { getOrgStatus, getOrgUserStatus } from 'app/react-utils'
import { SaraSession } from 'auth'
import { ThemeToggle } from 'components/theme-toggle'
import { Button } from 'components/ui/button'
import { useAppContext } from 'lib/hooks/app-context'
import { signOut, useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

const SettingsIndex = () => {
  const { activeBillingOrg } = useAppContext()
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const [userGitHubAppInstalled, setUserGitHubAppInstalled] =
    useState<boolean>(true)
  const [orgIsPremium, setOrgIsPremium] = useState<boolean>(true)

  useEffect(() => {
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

        setUserGitHubAppInstalled(
          orgUserStatus.gitHubAppInstalled === 'INSTALLED',
        )
        setOrgIsPremium(orgUserStatus.isPremium === 'PREMIUM')
      } catch (error) {
        toast.error(`Failed to fetch user status: ${error}`)
      }
    }

    fetchUserStatus()
  }, [activeBillingOrg, saraSession])

  return (
    <div className="flex flex-col items-center p-10 font-bold space-y-4">
      <p className="text-2xl font-bold">Account Settings</p>
      <div className="w-1/2 border-t-2 border-blue-600 my-2"></div>
      <Link href="/orgs" className="w-1/2">
        <div className="bg-blue-500 shadow-md rounded-lg p-4 block transform transition hover:scale-105 cursor-pointer">
          <div className="flex items-center justify-center text-white">
            <h3 className="text-lg font-semibold flex-1 text-center">
              Switch Billing Context:{' '}
              {activeBillingOrg
                ? activeBillingOrg.name
                : 'No selected billing context'}
            </h3>
            {activeBillingOrg && (
              <div className="flex-shrink-0 ml-4">
                <p>✅</p>
              </div>
            )}
          </div>
        </div>
      </Link>
      <Link href="settings/billing-status" className="w-1/2">
        <div className="bg-blue-500 shadow-md rounded-lg p-4 block transform transition hover:scale-105 cursor-pointer">
          <div className="flex items-center justify-center text-white">
            <h3 className="text-lg font-semibold flex-1 text-center">
              Billing Status: {orgIsPremium ? 'Premium Plan' : 'Free Plan'}
            </h3>
            {!orgIsPremium ? (
              <div
                title="No Premium Plan Configured."
                className="flex-shrink-0"
              >
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              </div>
            ) : (
              <p className="flex-shrink-0">✅</p>
            )}
          </div>
        </div>
      </Link>
      <Link href="/settings/authorize-private-repos" className="w-1/2">
        <div className="bg-blue-500 shadow-md rounded-lg p-4 block transform transition hover:scale-105 cursor-pointer">
          <div className="flex items-center justify-center text-white">
            <h3 className="text-lg font-semibold flex-1 text-center">
              Authorize Github Access:{' '}
              {userGitHubAppInstalled
                ? 'Access Configured'
                : 'Access Not Configured'}
            </h3>
            {!userGitHubAppInstalled ? (
              <div
                title="The User GitHub App has not been installed."
                className="flex-shrink-0"
              >
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              </div>
            ) : null}
            {userGitHubAppInstalled && (
              <div className="flex-shrink-0 ml-4">
                <p>✅</p>
              </div>
            )}
          </div>
        </div>
      </Link>
      <div className="w-1/2 flex items-center justify-evenly">
        <Button
          onClick={() =>
            signOut({
              callbackUrl: '/',
            })
          }
          className="text-lg dark:text-white bg-blue-500 p-5"
        >
          Log Out
        </Button>
        <ThemeToggle />
      </div>
    </div>
  )
}

export default SettingsIndex
