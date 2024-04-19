'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { Flex } from '@radix-ui/themes'
import { getOrgUserStatus } from 'app/react-utils'
import { SaraSession } from 'auth'
import CollapsibleRenderableResourceContent from 'components/renderable-resource/collapsible-renderable-resource-content'
import RenderableResourceContent from 'components/renderable-resource/renderable-resource-content'
import { useAppContext } from 'lib/hooks/app-context'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

import { getResource } from './../../../../../app/saraClient'
import auth1Image from './../../../../../public/auth1.png'
import auth2Image from './../../../../../public/auth2.png'
import auth3Image from './../../../../../public/auth3.png'

export interface OrgAndStatus {
  name: string
  orgStatus: {
    gitHubAppInstalled: string
    isPremium: string
  }
}

const SettingsGithubAppInstall = () => {
  const { activeBillingOrg } = useAppContext()
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const [userGitHubAppInstalled, setUserGitHubAppInstalled] =
    useState<boolean>(true)

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
      } catch (error) {
        toast.error(`Failed to fetch user status: ${error}`)
      }
    }

    fetchUserStatus()
  }, [activeBillingOrg, saraSession])

  return (
    <div className="flex flex-col items-center p-10">
      <div className="flex items-left text-left mb-2 w-full">
        <button className="btn-blue text-sm">
          <Link href="/settings">
            <Flex align="center">
              <ArrowLeftIcon className="mr-2" />
              Back to Settings
            </Flex>
          </Link>
        </button>
      </div>
      <RenderableResourceContent>
        <p className="text-2xl font-bold px-72">
          Authorize Private Repo Access
        </p>
      </RenderableResourceContent>
      <RenderableResourceContent>
        <div className="flex flex-col items-center text-center">
          <p className="font-bold">User App Installation Status</p>
          <p className="mt-2 italic">
            This is required for Sara to be able to manage your private repos
          </p>
          <p className="mt-1 italic">
            If you do not authorize Sara to access your private repos, you will
            not be able to manage your private repos with Sara
          </p>
          {userGitHubAppInstalled ? (
            <p className="font-bold">
              Sara has access to your private repos ✅
            </p>
          ) : (
            <p className="font-bold">
              Sara does not have access to your private repos 🛑
            </p>
          )}
          <div className="mt-2 w-full">
            <CollapsibleRenderableResourceContent title="Instructions for Installing">
              <div className="flex flex-col items-start">
                <p className="mb-2">1. Click on the github app install page</p>
                <p>2. Click on the configure button</p>
                <Image
                  src={auth1Image}
                  alt="Sara's AI Assistant"
                  title="Sara's AI Assistant"
                  className="mb-2"
                />
                <p>
                  3. Click on the button that has your github username on it
                </p>
                <Image
                  src={auth2Image}
                  alt="Sara's AI Assistant"
                  title="Sara's AI Assistant"
                  className="mb-2"
                />
                <p>4. Click on the install app button</p>
                <Image
                  src={auth3Image}
                  alt="Sara's AI Assistant"
                  title="Sara's AI Assistant"
                  className="mb-2"
                />
              </div>
            </CollapsibleRenderableResourceContent>
          </div>
          <Link
            href="https://github.com/apps/polyverse-boost"
            target="_blank"
            rel="noopener noreferrer"
            className="w-3/4"
          >
            <div className="bg-blue-600 shadow-md rounded-lg block transition hover:scale-105 cursor-pointer">
              <h3 className="text-lg font-semibold text-center text-white">
                Authorize for User
              </h3>
            </div>
          </Link>
          <p className="text-xs text-blue-600 mt-2">
            Note, this will redirect you to the Github
          </p>
        </div>
      </RenderableResourceContent>
    </div>
  )
}

export default SettingsGithubAppInstall
