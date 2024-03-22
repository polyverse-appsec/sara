'use client'

import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { getOrgStatus, getOrgUserStatus } from 'app/react-utils';
import { SaraSession } from 'auth';
import { Button } from 'components/ui/button';
import { useAppContext } from 'lib/hooks/app-context';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

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
        <p className="text-2xl font-bold">Account Settings</p>
        <div className="w-1/2 border-t-2 border-blue-600 my-2"></div>
        <Link 
            href="/orgs"
            className="w-3/4">
            <div className="bg-blue-600 shadow-md rounded-lg p-6 block transform transition hover:scale-105 cursor-pointer">
                <h3 className="text-lg font-semibold text-center text-white">
                Switch User Context
                </h3>
            </div>
        </Link>
        <Link 
            href="settings/billing-status"
            className="w-3/4">
            <div className="bg-blue-600 shadow-md rounded-lg p-6 block transform transition hover:scale-105 cursor-pointer">
                <h3 className="text-lg font-semibold text-center text-white">
                Billing Status
                </h3>
            </div>
        </Link>
        <Link href="/settings/authorize-private-repos"
            className="w-3/4">
            <div className="bg-blue-600 shadow-md rounded-lg p-6 block transform transition hover:scale-105 cursor-pointer">
                <div className="flex items-center justify-between w-full">
                    <h3 className="flex-1 text-lg font-semibold text-center text-white">
                    Authorize Github Access
                    </h3>
                    {!userGitHubAppInstalled ? (
                        <div title="The User GitHub App has not been installed." className="flex-shrink-0">
                        <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                        </div>
                    ) : null}
                    {!orgGitHubAppInstalled ? (
                        <div title="The Organization GitHub App has not been installed." className="flex-shrink-0">
                        <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                        </div>
                    ) : null}
                </div>
            </div>
        </Link>
        <Button 
            onClick={() =>
                signOut({
                callbackUrl: '/',
                })
            }
            className="text-lg bg-blue-600 p-5"
            >
            Log Out
        </Button>
    </div>
  )
}

export default SettingsIndex