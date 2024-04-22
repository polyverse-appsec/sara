'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import { Callout } from '@radix-ui/themes'
import { getOrgUserStatus } from 'app/react-utils'
import OauthExplanation from 'components/oauth-explanation'
import SaraLoading from 'components/sara-loading'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

import {
  createResource,
  createResourceNoResponseBody,
} from './../../../../../app/saraClient'
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
import { isPreviewFeatureEnabled } from 'lib/service-utils'

const ProjectCreate = () => {
  const router = useRouter()
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const { activeBillingOrg, setProjectIdForConfiguration } = useAppContext()

  const [controlledProjectDataSources, setControlledProjectDataSources] =
    useState<GitHubRepo[]>([])

  const [controlledPublicDataSourceUrl, setControlledPublicDataSourceUrl] =
    useState<string | null>(null)

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

  useEffect(() => {
    if (!activeBillingOrg) {
      return
    }
    if (!saraSession) {
      return
    }
  }, [activeBillingOrg, saraSession])

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

  if (!saraSession) {
    return <SaraLoading />
  }

  // Force a user to select an active billing context first before they can create
  // a project
  if (!activeBillingOrg) {
    return <SaraLoading />
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
              <h3 className="text-lg font-semibold">Project Name</h3>
              {displayRequiredText && !projectName && (
                <span className="ml-2 text-sm text-red-500">Required</span>
              )}
            </div>
            <Input
              value={projectName}
              placeholder="Enter project name"
              onChange={(e) => setProjectName(e.target.value)}
              disabled={!saveButtonEnabled}
            />
          </div>
          {/* This is the primary data source selector */}
          <div className="my-1">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">Data Source</h3>
              {displayRequiredText &&
                controlledProjectDataSources.length === 0 && (
                  <span className="ml-2 text-sm text-red-500">Required</span>
                )}
            </div>
            <PrimaryDataSourceSelector
              userIsPremium={userIsPremium}
              disableInput={!saveButtonEnabled}
              setControlledProjectDataSources={(gitHubRepos) =>
                setControlledProjectDataSources(gitHubRepos)
              }
              setControlledPublicDataSourceUrl={(publicDataSourceUrl) =>
                setControlledPublicDataSourceUrl(publicDataSourceUrl)
              }
            />
            <Callout.Root color="orange" className="mt-2">
              <Callout.Icon>
                <OauthExplanation />
              </Callout.Icon>
              <Callout.Text>
                If your orgs do not appear in this dropdown, configure Sara
                OAuth settings{' '}
                <Link
                  href="https://github.com/settings/connections/applications/b2fe85230b8f365e87f8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  here
                </Link>
              </Callout.Text>
            </Callout.Root>
          </div>
          {isAdvancedMenuOpen && (
            <div>
              <div className="w-3/4 border-t-2 border-blue-600 my-2"></div>
              <div className="my-1">
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold">Project Description</h3>
                  <p className="text-sm ml-2">(optional)</p>
                </div>
                <Input
                  value={projectDescription}
                  placeholder="Enter a description of your Project that Sara will use to guide her analysis"
                  onChange={(e) => setProjectDescription(e.target.value)}
                  disabled={!saveButtonEnabled}
                />
              </div>
              <div className="my-1">
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold">Project Guidelines</h3>
                  <p className="text-sm ml-2">(optional)</p>
                </div>
                <GuidelineInputs
                  disableInput={!saveButtonEnabled}
                  existingProjectGuidelines={controlledProjectGuidelines}
                  setProjectGuidelines={(guidelines: string[]) =>
                    setControlledProjectGuidelines(guidelines)
                  }
                />
              </div>
              {isPreviewFeatureEnabled("MultiTierProjectRepos", saraSession.email)?
                (<div className="my-1">
                    <div className="flex items-center">
                        <h3 className="text-lg font-semibold">
                            Additional Data Sources
                        </h3>
                        <p className="text-sm ml-2">(optional)</p>
                    </div>
                    {/* Currently this data source selector is only able to select one repo, it's the same one that was used for primary repo select I just 
                moved it here to replace it with a dropdown menu to signal clearer ui. Once we build multi project functionality we'll need to 
                change this */}
                    <DataSourceSelector
                    orgName={activeBillingOrg.name}
                    disableInput={!saveButtonEnabled}
                    setControlledProjectDataSources={(gitHubRepos) =>
                        setControlledProjectDataSources(gitHubRepos)
                    }
                    />
                 </div>)
              :null}
            </div>
          )}
        </div>
        {!userIsPremium ? (
          <div className="text-left text-base text-red-500 my-1">
            <p>Please upgrade to premium to access create project features</p>
          </div>
        ) : null}
        {!userGitHubAppInstalled ? (
          <div className="text-left text-base text-red-500 my-1">
            <p>
              Please install Boost GitHub App for your user before creating a
              project
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
              !statusCheckDone ||
              !projectName ||
              !controlledProjectDataSources ||
              !userIsPremium
                ? 'bg-gray-500 hover:cursor-not-allowed'
                : 'btn-blue hover:bg-blue-700 hover:text-white'
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

              // Enforce either selecting a data source that we retrieved or the
              // user entering a public GitHub URL
              if (
                controlledProjectDataSources &&
                controlledProjectDataSources.length === 0 &&
                !controlledPublicDataSourceUrl
              ) {
                setDisplayRequiredText(true)
                toast.error(
                  `Please select a primary data source or enter a public Git URL`,
                )
                setSaveButtonEnabled(true)
                return
              }

              // Validate that the input to the public GitHub URL may be valid
              // by verifying there is a forward slash denoting the start of the
              // last URI segment with the name of the repo.
              if (controlledPublicDataSourceUrl) {
                const lastUriSegmentIndex =
                  controlledPublicDataSourceUrl.lastIndexOf('/')

                if (lastUriSegmentIndex === -1) {
                  toast.error(`Please provide a full GitHub URL`)
                  setSaveButtonEnabled(true)
                  return
                }

                // Validate that the last character in the string isn't a '/'
                if (
                  lastUriSegmentIndex ===
                  controlledPublicDataSourceUrl.length - 1
                ) {
                  toast.error(`Please provide a full GitHub URL`)
                  setSaveButtonEnabled(true)
                  return
                }
              }

              // Make sure to trim the guidelines to start pull out any
              // whitespace
              const guidelines = controlledProjectGuidelines
                .map((guideline) => guideline.trim())
                .filter((guideline) => guideline !== '')

              try {
                // The <PrimaryDataSourceSelector> component ought to either set
                // an array of project data sources if a personal/organizational
                // repo was selected in a dropdown or set the full Git URL if
                // provided in an input box by the user. If the full Git URL was
                // provided convert it into the type `GitHubRepo` type as best
                // as we can since it is what the Boost service expects.
                let projectDataSources = null

                if (controlledPublicDataSourceUrl) {
                  // Having already done validation of the public URL above we
                  // add one here to ensure that we are picking up the starting
                  // position of the name and not the forward slash in our
                  // substring
                  const lastUriSegment =
                    controlledPublicDataSourceUrl.lastIndexOf('/') + 1

                  const publicDataSourceName =
                    controlledPublicDataSourceUrl.substring(lastUriSegment)

                  const userProvidedGitHubRepo: GitHubRepo = {
                    name: publicDataSourceName,
                    htmlUrl: controlledPublicDataSourceUrl,
                    private: false,
                  }

                  projectDataSources = [userProvidedGitHubRepo]
                } else {
                  projectDataSources = controlledProjectDataSources
                }

                // First create the project for the user...
                const projectBody = {
                  name: trimmedProjectName,
                  description: projectDescription,
                  projectDataSources,
                  guidelines,
                }

                const project = await createResource<Project>(
                  `/orgs/${activeBillingOrg.id}/projects`,
                  projectBody,
                  'Failed to create project',
                )

                // Start configuring the project in the background
                setProjectIdForConfiguration(project.id)

                // Now create the default goal for it before we route to it.
                // Note that we won't create a chat for it here and leave it up
                // to the user if they would like to start a chat before we
                // might have fully synced their code to the vector store.
                const goalBody = {
                  orgId: activeBillingOrg.id,
                  parentProjectId: project.id,
                  name: 'Learn More About Your Project',
                  description:
                    'Provide details that will help me learn about my project. This includes details about the code in my project as well as the software packages/libraries it consumes.',
                }

                const goal = await createResource<Goal>(
                  `/goals`,
                  goalBody,
                  `Failed to create default goal for project '${project.id}'`,
                )

                router.push(`/goals/${goal.id}`)
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
              !statusCheckDone ||
              !userIsPremium
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
            {!isAdvancedMenuOpen ? 'Advanced Configuration' : 'Hide Advanced'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectCreate
