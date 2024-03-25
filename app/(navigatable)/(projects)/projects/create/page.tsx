'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getOrgStatus, getOrgUserStatus } from 'app/react-utils'
import Joi from 'joi'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

import { type SaraSession } from './../../../../../auth'
import { Button } from './../../../../../components/ui/button'
import { Input } from './../../../../../components/ui/input'
import {
  type GitHubRepo,
  type GoalPartDeux,
  type ProjectPartDeux,
} from './../../../../../lib/data-model-types'
import { useAppContext } from './../../../../../lib/hooks/app-context'
import { projectNameSchema } from './../../../../../lib/polyverse/db/validators'
import DataSourceSelector from './data-source-selector'
import SingleDataSourceSelector from './single-data-source-selector'

const postProject = async (
  billingOrgId: string,
  name: string,
  description: string,
  projectDataSources: GitHubRepo[],
): Promise<ProjectPartDeux> => {
  const projectBody = {
    name,
    description,
    projectDataSources,
  }

  const res = await fetch(`/api/orgs/${billingOrgId}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projectBody),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.debug(`Failed to POST project because: ${errText}`)

    throw new Error(`Failed to POST project`)
  }

  return (await res.json()) as ProjectPartDeux
}

const postDefaultGoal = async (
  billingOrgId: string,
  projectId: string,
): Promise<GoalPartDeux> => {
  const goalBody = {
    orgId: billingOrgId,
    parentProjectId: projectId,
    name: 'Learn More About Your Project',
    description:
      'Provide details that will help me learn about my project. This includes details about the code in my project as well as the software packages/libraries it consumes.',
  }

  const res = await fetch(`/api/goals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(goalBody),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.debug(`Failed to POST default project goal because: ${errText}`)

    throw new Error(`Failed to POST default project goal`)
  }

  return (await res.json()) as GoalPartDeux
}

const postChatForDefaultGoal = async (goalId: string, query: string) => {
  const chatBody = {
    query,
  }

  const res = await fetch(`/api/goals/${goalId}/chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(chatBody),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.debug(
      `Failed to POST chat for default project goal because: ${errText}`,
    )

    throw new Error(`Failed to POST chat for default project goal`)
  }
}

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

  const [orgGithubAppInstalled, setOrgGitHubAppInstalled] =
    useState<boolean>(true)

  const [userIsPremium, setUserIsPremium] = useState<boolean>(true)

  const [statusCheckDone, setStatusCheckDone] = useState<boolean>(false)

  const [isAdvancedMenuOpen, setIsAdvancedMenuOpen] = useState(false)

  const toggleDropdown = () => setIsAdvancedMenuOpen(!isAdvancedMenuOpen)

  
 async function fetchGoalsWithRetry(projectId: any, maxAttempts = 60, delay = 5000, currentAttempt = 1) {
  const goalsRes = await fetch(`/api/projects/${projectId}/goals`);
  if (goalsRes.ok) {
    const fetchedGoals = await goalsRes.json();
    if (fetchedGoals.length > 0) {
      console.log('Goals fetched successfully:', fetchedGoals);
      router.push(`/goals/${fetchedGoals[0].id}`);
    } else if (currentAttempt < maxAttempts) {
      setTimeout(() => fetchGoalsWithRetry(projectId, maxAttempts, delay, currentAttempt + 1), delay);
    } else {
      console.log('Failed to fetch goals after max attempts');
    }
  } else {
    console.log('Failed to fetch goals:', goalsRes.statusText);
    router.push(`/projects/${projectId}`);
  }
}


  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        if (!activeBillingOrg) {
          toast.error(`No active billing org set`)
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

        const orgStatus = await getOrgStatus(
          activeBillingOrg.id,
          saraSession.id,
        )

        setStatusCheckDone(true)
        setUserGitHubAppInstalled(
          orgUserStatus.gitHubAppInstalled === 'INSTALLED',
        )
        setOrgGitHubAppInstalled(orgStatus.gitHubAppInstalled === 'INSTALLED')
        setUserIsPremium(orgUserStatus.isPremium === 'PREMIUM')
      } catch (error) {
        toast.error(`Failed to fetch user status: ${error}`)
      }
    }

    fetchUserStatus()
  }, [activeBillingOrg, saraSession])

  // Force a user to select an active billing org first before they can create
  // a project
  if (!activeBillingOrg) {
    toast.error(`Please select billing organization`)

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
            <h3 className="text-lg font-semibold">Set Project Name</h3>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          {/* This is the primary data source selector */}
          <div className="my-1">
            <h3 className="text-lg font-semibold">
              Select Project Data Sources
            </h3>
            <SingleDataSourceSelector
              orgName={activeBillingOrg.name}
              setControlledProjectDataSources={(gitHubRepos) =>
                setControlledProjectDataSources(gitHubRepos)
              }
            />
          </div>
          {isAdvancedMenuOpen && (
            <div>
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
              <div className="my-1">
                <h3 className="text-lg font-semibold">
                  Add Project Description
                </h3>
                <Input
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
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
        {!orgGithubAppInstalled ? (
          <div className="text-left text-base text-red-500 my-1">
            <p>
              Please install Boost GitHub App for your organization before
              creating a project.
            </p>
          </div>
        ) : null}
        {!userIsPremium ? (
          <div className="text-left text-base text-red-500 my-1">
            <p>
              Please upgrade to a Premium account before creating a project.
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
              !orgGithubAppInstalled ||
              !userIsPremium ||
              !statusCheckDone
                ? 'bg-gray-500'
                : 'bg-green-500 hover:bg-green-200'
            } transition duration-300`}
            onClick={async (e) => {
              e.preventDefault()

              setSaveButtonEnabled(false)

              if (!projectName) {
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
                toast.error(`Please select a primary data source`)
                setSaveButtonEnabled(true)
                return
              }

              try {
                // First create the project for the user...
                const project = await postProject(
                  activeBillingOrg.id,
                  trimmedProjectName,
                  projectDescription,
                  controlledProjectDataSources,
                )

                setProjectIdForConfiguration(project.id)

                //router.push(`/projects/${project.id}`)
                await fetchGoalsWithRetry(project.id);
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
              !orgGithubAppInstalled ||
              !userIsPremium ||
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
