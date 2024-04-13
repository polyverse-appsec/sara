'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ExclamationTriangleIcon,
  GearIcon,
  StarFilledIcon,
} from '@radix-ui/react-icons'
import { Flex, HoverCard, Inset, Skeleton, Text } from '@radix-ui/themes'
import { SaraSession } from 'auth'
import ProjectStatusDetailsHoverCard from 'components/project-status/project-status-details-card'
import { type Org } from 'lib/data-model-types'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

import { getOrgUserStatus } from './../app/react-utils'
import { getResource } from './../app/saraClient'
import { useAppContext } from './../lib/hooks/app-context'
import SaraPortrait from './../public/Sara_Cartoon_Portrait.png'
import GoalsTaskNavTree from './goals-tasks-nav-tree'
import LoadingCircle from './loading-spinner'

function getUserInitials(name: string) {
  const [firstName, lastName] = name.split(' ')
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName.slice(0, 2)
}

const SidebarNav = () => {
  const router = useRouter()
  const {
    activeBillingOrg,
    setActiveBillingOrg,
    projectIdForConfiguration,
    setProjectIdForConfiguration,
    activeProjectDetails,
    activeWorkspaceDetails,
  } = useAppContext()

  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const [orgIsPremium, setOrgIsPremium] = useState(false)
  const [userGitHubAppInstalled, setUserGitHubAppInstalled] =
    useState<boolean>(true)
  const [loadingBillingOrg, setLoadingBillingOrg] = useState<boolean>(true)

  const [width, setWidth] = useState(225)
  const [mouseDown, setMouseDown] = useState(false)

  const dragRef = useRef(null)
  const sidebarRef = useRef(null)

  useEffect(() => {
    const fetchAndSetActiveBillingOrg = async () => {
      if (!activeBillingOrg) {
        const orgs = await getResource<Org[]>(`/orgs`)

        if (orgs.length > 0) {
          setLoadingBillingOrg(false)
          setActiveBillingOrg(orgs[0])
        }
      }
    }

    fetchAndSetActiveBillingOrg()

    const fetchGitHubAppAndPremiumStatus = async () => {
      try {
        if (!activeBillingOrg || !saraSession) {
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
      } catch (err) {
        console.debug(`Failed to fetch premium status because: ${err}`)
      }
    }

    fetchGitHubAppAndPremiumStatus()
  }, [
    activeBillingOrg,
    setActiveBillingOrg,
    projectIdForConfiguration,
    saraSession,
    router,
  ])

  const handleMouseUp = (_event: any) => {
    setMouseDown(false)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (event: any) => {
    if (mouseDown) {
      if (event.clientX + 10 >= 150) {
        setWidth(event.clientX + 50)
      }
    }
  }

  const handleMouseDown = (e: any) => {
    e.preventDefault()
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    setMouseDown(true)
  }

  // We do dynamic class naming here to position the sticky elements and
  // determine the height of the draggable <div>. This is because there are
  // sticky headers that are positioned in the component <HeaderCallouts>. For
  // more details around sizing see <HeaderCallouts>.
  const topDivClassname = saraSession
    ? 'sticky top-112 overflow-auto'
    : 'sticky top-96 overflow-auto'

  const draggableDivClassname = saraSession
    ? 'flex flex-col h-[calc(100vh-112px)] bg-white dark:bg-black transition duration-200 ease-in-out'
    : 'flex flex-col h-[calc(100vh-96px)] bg-white dark:bg-black transition duration-200 ease-in-out'

  return (
    <div className={topDivClassname}>
      <div
        ref={sidebarRef}
        className={draggableDivClassname}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ width: `${width}px` }} // Use inline style for dynamic width
      >
        {/* Logo section */}
        <div className="flex flex-col items-center sticky top-0 z-10 p-4 m-5 rounded-full border-4 border-blue-500">
          <Image
            src={SaraPortrait}
            alt="Sara's AI Assistant"
            title="Sara's AI Assistant"
            width={100}
            height={100}
            className="rounded-full"
          />
          <p className="text-lg mt-2">Sara</p>
          <p className="text-sm italic">AI Assistant</p>
        </div>

        {/* Navigation Buttons */}
        <nav className="flex flex-col space-y-1 p-2">
          {/* Projects Button */}
          <button
            className="flex items-center justify-center px-4 py-2 rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-colors"
            onClick={() => {
              if (!activeBillingOrg) {
                toast.error(`Please select billing context`)
                router.push('/orgs')
              }
              setProjectIdForConfiguration(null)
              router.push('/projects')
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
              />
            </svg>
            <span className="ml-3">Switch Project</span>
          </button>
          {/* ...other buttons */}
        </nav>

        <Flex direction="column" align="center">
          <div className="w-1/2 border-t-2 rounded-xl border-blue-600 my-2"></div>
        </Flex>
        <HoverCard.Root>
          <HoverCard.Trigger>
            <Flex gap="2" align="center" direction="column">
              {projectIdForConfiguration ? (
                <>
                  <Text size="2" weight="bold">
                    Active Project:
                  </Text>
                  <Link
                    href={`/projects/${activeProjectDetails?.id}`}
                    className="hover:underline"
                  >
                    <Text size="2">{activeProjectDetails?.project.name}</Text>
                  </Link>
                </>
              ) : (
                <Text size="2">No Project Selected</Text>
              )}
            </Flex>
          </HoverCard.Trigger>
          {activeProjectDetails ? (
            <HoverCard.Content>
              <Inset>
                <ProjectStatusDetailsHoverCard
                  health={activeProjectDetails.health}
                  lastRefreshedAt={activeProjectDetails.project.lastRefreshedAt}
                />
              </Inset>
            </HoverCard.Content>
          ) : null}
        </HoverCard.Root>
        <Flex direction="column" align="center">
          <div className="w-1/2 border-t-2 rounded-xl border-blue-600 my-2"></div>
        </Flex>

        <div className="grow rounded-lg border border-blue-500 no-scrollbar m-2 overflow-hidden">
          {/* Resource Loader */}
          {projectIdForConfiguration ? (
            <GoalsTaskNavTree
              projectId={projectIdForConfiguration}
              activeGoalId={
                activeWorkspaceDetails ? activeWorkspaceDetails.goalId : null
              }
              activeTaskId={
                activeWorkspaceDetails ? activeWorkspaceDetails.taskId : null
              }
            />
          ) : (
            <div>
              <p className="text-center font-semibold">
                Goals & Tasks Explorer
              </p>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="w-3/4 mx-auto border-t-4 rounded-xl border-blue-600 mt-2"></div>
        <div className="flex flex-col items-center sticky bottom-0 z-10 w-full p-2 bg-orange-200">
          <div className="flex items-center">
            {/* Github User Info */}
            {!saraSession ? (
              <LoadingCircle />
            ) : saraSession.picture ? (
              <Image
                className="w-8 h-8 transition-opacity duration-300 rounded-full select-none ring-1 ring-zinc-100/10 hover:opacity-80"
                src={saraSession.picture ? `${saraSession.picture}&s=60` : ''}
                alt={saraSession.name ?? 'Avatar'}
                title={saraSession.name ?? 'Avatar'}
                height={48}
                width={48}
              />
            ) : (
              <div className="flex items-center justify-center text-xs font-medium uppercase rounded-full select-none h-7 w-7 shrink-0 bg-muted/50 text-muted-foreground">
                {saraSession.name ? getUserInitials(saraSession.name) : null}
              </div>
            )}
            <span className="ml-2 dark:text-black">{saraSession?.name}</span>
            <div className="relative w-5 h-5 ml-2">
              <GearIcon
                className="w-full h-full transition-opacity duration-300 rounded-full select-none ring-1 ring-zinc-100/10 dark:text-black hover:opacity-50"
                onClick={() => {
                  setProjectIdForConfiguration(null)
                  router.push('/settings')
                }}
              />
              {(!orgIsPremium || !userGitHubAppInstalled) && (
                <span className="absolute top-0 right-0 block w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </div>
            {(!orgIsPremium || !userGitHubAppInstalled) && (
              <div title="Sara not properly configured" className="ml-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
              </div>
            )}
          </div>

          {/* Organization Info */}
          <div className="px-4 mt-2 rounded-lg">
            <div className="text-sm text-center text-zinc-500">
              {saraSession?.email}
            </div>
            <div className="flex items-center justify-center mt-1">
              {orgIsPremium && (
                <div
                  title="Premium Plan"
                  className="flex items-center justify-center mr-2 p-1 border border-yellow-500 rounded-full"
                >
                  <StarFilledIcon className="w-2 h-2 text-yellow-500" />
                </div>
              )}
              <Skeleton loading={loadingBillingOrg}>
                <span className="text-sm truncate dark:text-black">
                  {activeBillingOrg ? (
                    <Link href={`/orgs/${activeBillingOrg.id}`}>
                      {activeBillingOrg.name === saraSession?.username ? (
                        <p className="hover:underline">Personal</p>
                      ) : (
                        <p className="hover:underline">
                          {activeBillingOrg.name}
                        </p>
                      )}
                    </Link>
                  ) : (
                    <Link href="/orgs">
                      <p className="hover:underline">
                        No Billing Context Selected
                      </p>
                    </Link>
                  )}
                </span>
              </Skeleton>
            </div>
          </div>
        </div>
        <div
          ref={dragRef}
          className="absolute top-0 right-0 h-full w-1 bg-orange-500 cursor-col-resize"
          style={{ zIndex: 1000 }} // Ensure drag handle is above all content for usability
          onMouseDown={handleMouseDown}
        ></div>
      </div>
    </div>
  )
}

export default SidebarNav
