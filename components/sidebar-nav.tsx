'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ExclamationTriangleIcon, StarFilledIcon } from '@radix-ui/react-icons'
import { GearIcon } from '@radix-ui/react-icons'
import LoadingCircle from './loading-spinner'
import { SaraSession } from 'auth'
import { UserMenu } from 'components/user-menu' // Update this import based on your project structure
import { motion } from 'framer-motion'
import {
  ProjectHealth,
  ProjectHealthStatusValue,
  ProjectPartDeux,
  UserOrgStatus,
} from 'lib/data-model-types'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

import { getOrgStatus, getOrgUserStatus, renderHealthIcon } from './../app/react-utils'
import { useAppContext } from './../lib/hooks/app-context'
import SaraPortrait from './../public/Sara_Cartoon_Portrait.png'
import NavResourceLoader from './nav-resource-tree/nav-resource-loader'

function getUserInitials(name: string) {
  const [firstName, lastName] = name.split(' ')
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName.slice(0, 2)
}

const SidebarNav = () => {
  const router = useRouter()
  const {
    user,
    activeBillingOrg,
    setActiveBillingOrg,
    projectIdForConfiguration,
    setProjectIdForConfiguration,
  } = useAppContext()
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const [selectedProject, setSelectedProject] =
    useState<ProjectPartDeux | null>(null)
  const [selectedProjectHealth, setSelectedProjectHealth] =
    useState<ProjectHealth | null>(null)
  const [orgIsPremium, setOrgIsPremium] = useState(true)
  const [userGitHubAppInstalled, setUserGitHubAppInstalled] =
    useState<boolean>(true)
  const [orgGitHubAppInstalled, setOrgGitHubAppInstalled] =
    useState<boolean>(true)
  const [orgs, setOrgs] = useState([])

  useEffect(() => {
    const fetchAndSetActiveBillingOrg = async () => {
      if (!activeBillingOrg) {
        const res = await fetch('/api/orgs')

        if (!res.ok) {
          const errText = await res.text()

          throw new Error(
            `Failed to get a success response when fetching organizations because: ${errText}`,
          )
        }

        const fetchedOrgs = await res.json()

        setOrgs(fetchedOrgs)

        if (fetchedOrgs.length > 0) {
          setActiveBillingOrg(fetchedOrgs[0])
        }
      }
    }

    fetchAndSetActiveBillingOrg()

    const fetchGithubAppAndPremiumStatus = async () => {
      try {
        if (!activeBillingOrg || !saraSession) {
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
      } catch (err) {
        console.debug(`Failed to fetch premium status because: ${err}`)
      }
    }

    const fetchProjectDetails = async () => {
      try {
        const projectRes = await fetch(
          `/api/projects/${projectIdForConfiguration}`,
        )

        if (!projectRes.ok) {
          const errText = await projectRes.text()
          throw new Error(
            `Failed to get a success response when fetching project '${projectIdForConfiguration}' because: ${errText}`,
          )
        }

        const fetchedProject = (await projectRes.json()) as ProjectPartDeux
        setSelectedProject(fetchedProject)

        const healthRes = await fetch(
          `/api/projects/${projectIdForConfiguration}/health`,
        )

        if (healthRes.ok) {
          const fetchedHealth = (await healthRes.json()) as ProjectHealth
          setSelectedProjectHealth(fetchedHealth)
        } else {
          console.debug(`Failed to get project health`)
        }
      } catch (err) {
        console.debug(`Failed to fetch project details because: ${err}`)
      }
    }

    if (projectIdForConfiguration) {
      fetchProjectDetails()
    }

    fetchGithubAppAndPremiumStatus()
  }, [
    activeBillingOrg,
    setActiveBillingOrg,
    projectIdForConfiguration,
    saraSession,
    router,
  ])

  return (
    <motion.aside
      className="flex flex-col h-screen absolute inset-y-0 left-0 -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out"
      initial={{ width: 0 }}
      animate={{ width: 250 }}
      exit={{ width: 0 }}
      transition={{ type: 'spring', bounce: 0 }}
    >
      {/* Logo section */}
      <div className="flex flex-col items-center p-4 m-5">
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
              toast.error(`Please select billing organization`)
              return
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
          <span className="ml-3">Projects</span>
        </button>
        {/* ...other buttons */}
      </nav>

      {/* Current Project Info */}
      {projectIdForConfiguration ? (
        <div className="flex justify-center items-center px-4 py-2 rounded-lg bg-secondary text-secondary-foreground my-2 ml-4">
          <div className="">
            <p>{selectedProject ? selectedProject.name : null}</p>
          </div>
          {selectedProjectHealth
            ? renderHealthIcon(selectedProjectHealth.readableValue)
            : null}
        </div>
      ) : (
        <p className="flex justify-center px-2 py-1 text-base font-medium rounded-lg">
          No project selected
        </p>
      )}

      {/* Resource Loader */}
      {projectIdForConfiguration ? (
        <NavResourceLoader projectId={projectIdForConfiguration} />
      ) : null}

      {/* Bottom Section */}
      <div className="flex flex-col items-center mt-auto w-full">
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
          <span className="ml-2">{saraSession?.name}</span>
          <div className="relative w-5 h-5 ml-2">
            <GearIcon
              className="w-full h-full transition-opacity duration-300 rounded-full select-none ring-1 ring-zinc-100/10 hover:opacity-50"
              onClick={() => {
                setProjectIdForConfiguration(null)
                router.push('/settings')
              }}
            />
            { (!orgIsPremium || !userGitHubAppInstalled || !orgGitHubAppInstalled) && (
              <span className="absolute top-0 right-0 block w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </div>
          { (!orgIsPremium || !userGitHubAppInstalled || !orgGitHubAppInstalled) && (
              <div title="Sara not properly configured" className="ml-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500"/>
              </div>
            )}
        </div>

        {/* Organization Info */}
        <div className="px-4 py-2 rounded-lg mb-2">
          <div className="text-xs text-zinc-500">{saraSession?.email}</div>
          <div className="flex items-center mt-1">
            {orgIsPremium && (
              <div
                title="Premium Plan"
                className="flex items-center justify-center mr-2 p-1 border border-yellow-500 rounded-full"
              >
                <StarFilledIcon className="w-2 h-2 text-yellow-500" />
              </div>
            )}
            <span className="text-xs truncate">
              {activeBillingOrg ? activeBillingOrg.name : 'No org selected'}
            </span>
          </div>
        </div>
      </div>
    </motion.aside>
  )
}

export default SidebarNav
