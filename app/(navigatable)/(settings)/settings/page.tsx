'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { getOrgStatus, getOrgUserStatus } from 'app/react-utils'
import { SaraSession } from 'auth'
import { useAppContext } from 'lib/hooks/app-context'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

const SettingsIndex = () => {
  const { activeBillingOrg } = useAppContext()
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const [userGitHubAppInstalled, setUserGitHubAppInstalled] =
    useState<boolean>(true)
  const [orgGitHubAppInstalled, setOrgGitHubAppInstalled] =
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

        const orgStatus = await getOrgStatus(
          activeBillingOrg.id,
          saraSession.id,
        )

        setUserGitHubAppInstalled(
          orgUserStatus.gitHubAppInstalled === 'INSTALLED',
        )
        setOrgGitHubAppInstalled(orgStatus.gitHubAppInstalled === 'INSTALLED')
        setOrgIsPremium(orgUserStatus.isPremium === 'PREMIUM')
      } catch (error) {
        toast.error(`Failed to fetch user status: ${error}`)
      }
    }

    fetchUserStatus()
  }, [activeBillingOrg, saraSession])

  return (
    <div className="flex flex-col items-center p-10 font-bold space-y-4">
      <p className="text-2xl font-bold">Settings</p>
      <div className="w-1/2 border-t-2 border-blue-600 my-2"></div>
      <Link href="/orgs" className="w-3/4">
        <div className="bg-blue-600 shadow-md rounded-lg p-6 block transform transition hover:scale-105 cursor-pointer">
          <h3 className="text-lg font-semibold text-center text-white">
            Manage Organizations
          </h3>
        </div>
      </Link>
      <Link
        href="https://billing.stripe.com/p/login/28o9DQ0uKf7o4OkaEE"
        target="_blank"
        rel="noopener noreferrer"
        className="w-3/4"
      >
        <div className="bg-blue-600 shadow-md rounded-lg p-6 block transform transition hover:scale-105 cursor-pointer">
          <h3 className="text-lg font-semibold text-center text-white">
            Account Management
          </h3>
        </div>
      </Link>
      <Link href="/settings/org-upgrade" className="w-3/4">
        <div className="bg-blue-600 shadow-md rounded-lg p-6 block transform transition hover:scale-105 cursor-pointer">
          <div className="flex items-center justify-between w-full">
            <h3 className="flex-1 text-lg font-semibold text-center text-white">
              Upgrade an Org to Premium
            </h3>
            {!orgIsPremium ? (
              <div
                title="The current selected org is not on a premium plan."
                className="flex-shrink-0"
              >
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
              </div>
            ) : null}
          </div>
        </div>
      </Link>
      <Link href="/settings/authorize-private-repos" className="w-3/4">
        <div className="bg-blue-600 shadow-md rounded-lg p-6 block transform transition hover:scale-105 cursor-pointer">
          <div className="flex items-center justify-between w-full">
            <h3 className="flex-1 text-lg font-semibold text-center text-white">
              Authorize Private Repositories
            </h3>
            {!userGitHubAppInstalled ? (
              <div
                title="The User GitHub App has not been installed."
                className="flex-shrink-0"
              >
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              </div>
            ) : null}
            {!orgGitHubAppInstalled ? (
              <div
                title="The Organization GitHub App has not been installed."
                className="flex-shrink-0"
              >
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              </div>
            ) : null}
          </div>
        </div>
      </Link>
    </div>
  )
}

export default SettingsIndex
