'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getOrgStatus, getOrgUserStatus } from 'app/react-utils'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

import { createResource } from './../../../../../app/saraClient'
import { type SaraSession } from './../../../../../auth'
import { Button } from './../../../../../components/ui/button'
import { Input } from './../../../../../components/ui/input'
import {
  type GitHubRepo,
  type Goal,
  type Project,
} from './../../../../../lib/data-model-types'
import { useAppContext } from './../../../../../lib/hooks/app-context'
import { projectNameSchema } from './../../../../../lib/polyverse/db/validators'
import DataSourceSelector from './data-source-selector'
import GuidelineInputs from './guideline-inputs'
import PrimaryDataSourceSelector from './primary-data-source-selector'

const ProjectCreate = () => {
  const router = useRouter()
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const { activeBillingOrg, setProjectIdForConfiguration } = useAppContext()

  const [controlledProjectDataSources, setControlledProjectDataSources] =
    useState<GitHubRepo[]>([])

  const [projectName, setProjectName] = useState<string>('')

  const [projectDescription, setProjectDescription] = useState<string>('')

  const [saveButtonEnabled, setSaveButtonEnabled] = useState<boolean>(true)

  const [userGitHubAppInstalled, setUserGitHubAppInstalled] =
    useState<boolean>(true)

  const [userIsPremium, setUserIsPremium] = useState<boolean>(true)

  const [statusCheckDone, setStatusCheckDone] = useState<boolean>(false)

  const [isAdvancedMenuOpen, setIsAdvancedMenuOpen] = useState(false)

  const [displayRequiredText, setDisplayRequiredText] = useState(false)

  const [controlledProjectGuidelines, setControlledProjectGuidelines] =
    useState<string[]>([])

  const toggleDropdown = () => setIsAdvancedMenuOpen(!isAdvancedMenuOpen)

  async function fetchGoalsWithRetry(
    projectId: any,
    maxAttempts = 60,
    delay = 5000,
    currentAttempt = 1,
  ) {
    const goalsRes = await fetch(`/api/projects/${projectId}/goals`)

    // Just try again and hope the problem fixes itself :fingers-crossed:
    if (!goalsRes.ok) {
      setTimeout(
        () =>
          fetchGoalsWithRetry(
            projectId,
            maxAttempts,
            delay,
            currentAttempt + 1,
          ),
        delay,
      )

      return
    }

    const fetchedGoals = (await goalsRes.json()) as Goal[]

    if (fetchedGoals.length === 0 && currentAttempt < maxAttempts) {
      setTimeout(
        () =>
          fetchGoalsWithRetry(
            projectId,
            maxAttempts,
            delay,
            currentAttempt + 1,
          ),
        delay,
      )

      return
    }

    // If we still have 0 fetched goals at this point we don't have any retry
    // atempts left so just route to the projects page
    if (fetchedGoals.length === 0) {
      console.log(
        'Failed to get any goals while waiting for a default goal before max attempts',
      )

      router.push(`/projects/${projectId}`)

      return
    }

    // Only route to the goal if the default chat is created. Otherwise
    // retry.
    if (fetchedGoals[0].chatId) {
      router.push(`/goals/${fetchedGoals[0].id}`)
      return
    }

    // At this point we presume we got the default goal but it doesn't have a
    // chat ID so try again until one is created for it.
    if (currentAttempt < maxAttempts) {
      setTimeout(
        () =>
          fetchGoalsWithRetry(
            projectId,
            maxAttempts,
            delay,
            currentAttempt + 1,
          ),
        delay,
      )

      return
    }

    // Or if we are out of retry attempts just route to the project page...
    console.log(`Didn't find a default goal with a chat ID before max attempts`)

    router.push(`/projects/${projectId}`)
  }

  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        if (!activeBillingOrg) {
          toast.error(`No active billing context set`)
          return
        }

        if (!saraSession) {
          toast.error(`No session available`)
          return
        }

        const orgUserStatus = await getOrgUserStatus(
          activeBillingOrg.id,
          saraSession.id,
        )

        setStatusCheckDone(true)
        setUserGitHubAppInstalled(
          orgUserStatus.gitHubAppInstalled === 'INSTALLED',
        )
        setUserIsPremium(orgUserStatus.isPremium === 'PREMIUM')
      } catch (error) {
        toast.error(`Failed to fetch user status: ${error}`)
      }
    }

    fetchUserStatus()
  }, [activeBillingOrg, saraSession])

  // Force a user to select an active billing context first before they can create
  // a project
  if (!activeBillingOrg) {
    toast.error(`Please select billing context`)

    return null
  }

  return (
    <div className="flex-1 flex-col p-10">
      <div className="bg-background shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="text-base my-1">
            <p>
              Create a new Software Project for Sara to help you accomplish your
              Goals - based on her analysis of your code and specs, and AI
              generated Task lists.
            </p>
          </div>
          <div className="my-1">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">Set Project Name</h3>
              {displayRequiredText && !projectName && (
                <span className="ml-2 text-sm text-red-500">Required</span>
              )}
            </div>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          {/* This is the primary data source selector */}
          <div className="my-1">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">
                Select Project Data Source
              </h3>
              {displayRequiredText &&
                controlledProjectDataSources.length === 0 && (
                  <span className="ml-2 text-sm text-red-500">Required</span>
                )}
            </div>
            <PrimaryDataSourceSelector
              userIsPremium={userIsPremium}
              setControlledProjectDataSources={(gitHubRepos) =>
                setControlledProjectDataSources(gitHubRepos)
              }
            />
          </div>
          {isAdvancedMenuOpen && (
            <div>
              <div className="w-3/4 border-t-2 border-blue-600 my-2"></div>
              <div className="my-1">
                <h3 className="text-lg font-semibold">
                  Add Project Description
                </h3>
                <Input
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>
              <div className="my-1">
                <h3 className="text-lg font-semibold">
                  Input Project Guidelines
                </h3>
                <GuidelineInputs
                  setProjectGuidelines={(guidelines: string[]) =>
                    setControlledProjectGuidelines(guidelines)
                  }
                />
              </div>
              <div className="my-1">
                <h3 className="text-lg font-semibold">
                  Select Secondary Project Data Sources
                </h3>
                {/* Currently this data source selector is only able to select one repo, it's the same one that was used for primary repo select I just 
              moved it here to replace it with a dropdown menu to signal clearer ui. Once we build multi project functionality we'll need to 
              change this */}
                <DataSourceSelector
                  orgName={activeBillingOrg.name}
                  setControlledProjectDataSources={(gitHubRepos) =>
                    setControlledProjectDataSources(gitHubRepos)
                  }
                />
              </div>
            </div>
          )}
        </div>
        {!userGitHubAppInstalled ? (
          <div className="text-left text-base text-red-500 my-1">
            <p>
              Please install Boost GitHub App for your user before creating a
              project.
            </p>
          </div>
        ) : null}
        {!statusCheckDone ? (
          <div className="text-left text-base my-1">
            <p>Verifying permissions...</p>
          </div>
        ) : null}
        <div className="flex justify-between">
          <Button
            variant="ghost"
            className={`${
              !saveButtonEnabled ||
              !userGitHubAppInstalled ||
              !statusCheckDone
                ? 'bg-gray-500'
                : 'bg-green-500 hover:bg-green-200'
            } transition duration-300`}
            onClick={async (e) => {
              e.preventDefault()

              setSaveButtonEnabled(false)

              if (!projectName) {
                setDisplayRequiredText(true)
                toast.error(`Please provide a project name`)
                setSaveButtonEnabled(true)
                return
              }

              const trimmedProjectName = projectName.trim()

              if (projectNameSchema.validate(trimmedProjectName).error) {
                toast.error(
                  `Project name can only be alphanumerics - _ . and spaces`,
                )
                setSaveButtonEnabled(true)
                return
              }

              if (
                !controlledProjectDataSources ||
                controlledProjectDataSources.length === 0
              ) {
                setDisplayRequiredText(true)
                toast.error(`Please select a primary data source`)
                setSaveButtonEnabled(true)
                return
              }

              // Make sure to trim the guidelines to start pull out any
              // whitespace
              const guidelines = controlledProjectGuidelines
                .map((guideline) => guideline.trim())
                .filter((guideline) => guideline !== '')

              try {
                // First create the project for the user...
                const projectBody = {
                  name: trimmedProjectName,
                  description: projectDescription,
                  projectDataSources: controlledProjectDataSources,
                  guidelines,
                }

                const project = await createResource<Project>(
                  `/orgs/${activeBillingOrg.id}/projects`,
                  projectBody,
                  'Failed to create project',
                )

                setProjectIdForConfiguration(project.id)

                await fetchGoalsWithRetry(project.id)
              } catch (err) {
                console.debug(
                  `Caught error when trying to create a project: ${err}`,
                )

                setSaveButtonEnabled(true)

                toast.error(`Failed to create project`)
              }
            }}
            disabled={
              !saveButtonEnabled ||
              !userGitHubAppInstalled ||
              !statusCheckDone
            }
          >
            {saveButtonEnabled ? null : (
              <svg
                aria-hidden="true"
                className="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
            )}
            {saveButtonEnabled ? 'Create Project' : 'Building Project'}
          </Button>
          <button
            onClick={toggleDropdown}
            className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
          >
            Advanced Configuration
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectCreate
