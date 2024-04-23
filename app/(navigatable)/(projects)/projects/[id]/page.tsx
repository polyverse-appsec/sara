'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Flex } from '@radix-ui/themes'
import GoalsManager from 'components/goals/goals-manager'
import CopyToClipboardIcon from 'components/icons/CopyToClipboardIcon'
import EnabledResyncIcon from 'components/icons/EnabledResyncIcon'
import ProjectSourceSyncStatus from 'components/project-status/project-source-sync-status'
import ProjectStatusCard from 'components/project-status/project-status-card'
import SaraLoading from 'components/sara-loading'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { HoverCard } from '@radix-ui/themes'

import { type SaraSession } from './../../../../../auth'
import RenderableResource from './../../../../../components/renderable-resource/renderable-resource'
import RenderableResourceContent from './../../../../../components/renderable-resource/renderable-resource-content'
import { Button } from './../../../../../components/ui/button'
import {
  ProjectWithDataSources,
  type Goal,
  type ProjectHealth,
} from './../../../../../lib/data-model-types'
import { useAppContext } from './../../../../../lib/hooks/app-context'
import EditProjectPopout from 'components/project-details/edit-project-popout'
import { ProjectDiscoverRequestBody } from 'app/api/projects/[projectId]/discover/route'

const ProjectPageIndex = ({ params: { id } }: { params: { id: string } }) => {
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const {
    activeBillingOrg,
    setProjectIdForConfiguration,
    setActiveGoalId,
    activeWorkspaceDetails,
  } = useAppContext()

  const [refreshHealth, setRefreshHealth] = useState(false);

  const [project, setProject] = useState<ProjectWithDataSources | null>(null)
  const [health, setHealth] = useState<ProjectHealth | null>(null)
  const [rediscoverButtonEnabled, setRediscoverButtonEnabled] =
    useState<boolean>(true)
  const [goals, setGoals] = useState<Goal[]>([])
  const [copied, setCopied] = useState(false)

  const [toastedInactiveBillingOrg, setToastedInactiveBillingOrg] =
    useState<boolean>(false)
  const [refreshPage, setRefreshPage] = useState<boolean>(false)

  useEffect(() => {
    if (!activeBillingOrg) {
      return
    }

    if (!saraSession) {
      // just wait until we have a saraSession ready
      return
    }
  }, [activeBillingOrg, saraSession])
  // Memoizing fetchHealth using useCallback
  const fetchHealth = useCallback(async () => {
    const healthRes = await fetch(`/api/projects/${id}/health`);
    if (healthRes.ok) {
      const fetchedHealth = await healthRes.json() as ProjectHealth;
      setHealth(fetchedHealth);
      setRediscoverButtonEnabled(fetchedHealth.readableValue === 'HEALTHY');
    } else {
      console.debug('Failed to get project health');
    }
  }, [id]); // Dependency array includes `id` since it's used in the fetch URL

  // Use fetchHealth in useEffect
  useEffect(() => {
    fetchHealth();
  }, [fetchHealth, refreshHealth]);

  // This use effect is to just get the project details...
  useEffect(() => {
    let isMounted = true

    const fetchProjectDetailsFrequencyMilliseconds = 5000

    const fetchProjectDetails = async () => {
      try {
        const projectRes = await fetch(`/api/projects/${id}`)

        if (!projectRes.ok) {
          const errText = await projectRes.text()

          throw new Error(
            `Failed to get a success response when fetching project '${id}' because: ${errText}`,
          )
        }

        const fetchedProject = (await projectRes.json()) as ProjectWithDataSources
        setProject(fetchedProject)

        // Best effort collect goals associated with the project and its health
        const goalsRes = await fetch(`/api/projects/${id}/goals`)

        if (goalsRes.ok) {
          const fetchedGoals = (await goalsRes.json()) as Goal[]

          setGoals(fetchedGoals)
        } else {
          console.debug(`Failed to get project goals`)
        }

        const healthRes = await fetch(`/api/projects/${id}/health`)

        let projectDetailsRefreshCycleWithBackoffInMs = fetchProjectDetailsFrequencyMilliseconds

        if (healthRes.ok) {
          const fetchedHealth = (await healthRes.json()) as ProjectHealth
          setHealth(fetchedHealth)

          const oneMinuteInMs = 60 * 1000
          const oneMinuteInSeconds = 60
          // if we're healthy, then just recheck health every so often
          if (fetchedHealth.backgroundProjectStatus?.synchronized === true) {
            projectDetailsRefreshCycleWithBackoffInMs = 5 * oneMinuteInMs

          // if not synchronized, and not actively updating, then we can back off the refresh cycle - wait for manual repair
          } else if (fetchedHealth.backgroundProjectStatus?.activelyUpdating !== true) {
            projectDetailsRefreshCycleWithBackoffInMs = 15 * oneMinuteInMs

            // otherwise, we're not synchronized but we're actively updating, so we should refresh more frequently
            //      with a backoff
          } else {
            // if its less than a minute since the last discovery was launched, check every 5 seconds
            const timeElapsedSinceLastDiscoveryLaunchInSeconds = fetchedHealth.backgroundProjectStatus?.lastDiscoveryLaunch?
                (Date.now() - new Date(fetchedHealth.backgroundProjectStatus?.lastDiscoveryLaunch * 1000).getTime()) / 1000
                : 0
            if (timeElapsedSinceLastDiscoveryLaunchInSeconds <= oneMinuteInSeconds) {
              projectDetailsRefreshCycleWithBackoffInMs = 5 * 1000 // every 5 seconds for first minute
            } else if (timeElapsedSinceLastDiscoveryLaunchInSeconds <= 5 * oneMinuteInSeconds) {
              projectDetailsRefreshCycleWithBackoffInMs = 30 * 1000 // every 30 seconds for up to 5 mins
            } else if (timeElapsedSinceLastDiscoveryLaunchInSeconds <= 15 * oneMinuteInSeconds) {
              projectDetailsRefreshCycleWithBackoffInMs = 60 * 1000 // every minute up to 15 minutes
            } else {
              projectDetailsRefreshCycleWithBackoffInMs = 15 * oneMinuteInMs // every 15 minutes after 15 minutes
            }
          }

          // we're only going to enable source resynchronization if the project is healthy and already synchronized
          //    no reason to let a user interupt or hijack a synchronization already in progress
          setRediscoverButtonEnabled(fetchedHealth.readableValue === 'HEALTHY')
        } else {
          console.debug(`Failed to get project health`)
        }

        if (isMounted) {

          setTimeout(
            fetchProjectDetails,
            projectDetailsRefreshCycleWithBackoffInMs,
          )
        }
      } catch (err) {
        console.debug(`Failed to fetch project details because: ${err}`)

        if (isMounted) {
          setTimeout(
            fetchProjectDetails,
            fetchProjectDetailsFrequencyMilliseconds,
          )
        }
      }
    }

    fetchProjectDetails()

    return () => {
      isMounted = false
    }
  }, [id, activeBillingOrg, saraSession, refreshPage])
  
  if (refreshPage) {
    setTimeout(() => setRefreshPage(false), 2000)
  }

  if (!activeBillingOrg) {
    return <SaraLoading />
  }

  if (!saraSession) {
    return <SaraLoading />
  }

  if (activeWorkspaceDetails && activeWorkspaceDetails.goalId !== null) {
    setActiveGoalId(null)
  }

  if (!activeBillingOrg) {
    // Make sure to not spam the user with toasts that we are loading their
    // billing context
    if (!toastedInactiveBillingOrg) {
      setToastedInactiveBillingOrg(true)
      toast('Loading Billing Context')
    }

    return <SaraLoading />
  }

  if (!project) {
    return <SaraLoading />
  }

  // Once we have loaded our data set the project that ought to be actively
  // refreshed
  setProjectIdForConfiguration(project.id)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000) // Reset icon after 2 seconds
      },
      (err) => {
        console.error(
          `${saraSession.email} Failed to copy ID to clipboard:`,
          err,
        )
        setCopied(false)
      },
    )
  }

  return (
    <RenderableResource>
      <RenderableResourceContent>
        <div className="flex justify-between items-center w-full">
          <div className="text-left mb-2">
            <button className="btn-blue text-sm">
              <Link href="/projects">
                <Flex align="center">
                  <ArrowLeftIcon className="mr-2" />
                  Back to Projects
                </Flex>
              </Link>
            </button>
          </div>
          <div className="mr-2">
            <EditProjectPopout 
              projectId={project.id}
              existingProjectName={project.name}
              existingProjectDescription={project.description}
              existingProjectGuidelines={project.guidelines}
              onSubmitChange={setRefreshPage} />
          </div>
        </div>
        <div className="my-1 flex justify-between w-full">
          <div className="flex flex-col">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">Project:</h3>
              <p className="mx-2">{project.name}</p>
            </div>
            <div className="my-1 flex items-center">
              <h3 className="text-xs text-gray-500 italic">ID</h3>
              <p className="text-xs text-gray-500 italic ml-2">{project.id}</p>
              <Tooltip.Root>
                <Tooltip.Provider>
                  <Tooltip.Trigger
                    className="flex items-center cursor-pointer"
                    onClick={() => copyToClipboard(project.id)}
                  >
                    <CopyToClipboardIcon copied={copied} color="#6B7280" />
                  </Tooltip.Trigger>
                  <Tooltip.Content
                    side="left"
                    align="end"
                    className="clipboardCopyToolTip"
                  >
                    Copy Project Id
                  </Tooltip.Content>
                </Tooltip.Provider>
              </Tooltip.Root>
            </div>
            {project.description ? (
              <div className="my-1 flex items-center">
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="mx-2">{project.description}</p>
              </div>
            ) : null}
          </div>
          <Flex direction="column" align="center">
            <div className="mr-2">
              <ProjectStatusCard
                health={health}
                lastRefreshedAt={project.lastRefreshedAt}
              />
            </div>

            <Flex gap="1">
              <Button
                variant="ghost"
                className={(rediscoverButtonEnabled &&
                    (health?.readableValue === "HEALTHY" || !health?.backgroundProjectStatus?.activelyUpdating))?
                        "btn-blue hover:bg-blue-700 text-sm":
                        "bg-gray-500 hover:cursor-not-allowed text-sm"}
                disabled={!(rediscoverButtonEnabled &&
                    (health?.readableValue === "HEALTHY" || !health?.backgroundProjectStatus?.activelyUpdating)
                )}
                onClick={async (e) => {
                  e.preventDefault()

                  setRediscoverButtonEnabled(false)

                  if (!activeBillingOrg || !saraSession) {
                    console.error(
                      `${project.id} Missing required billing and user information.`,
                    )
                    return
                  }

                  try {
                    // try to rediscover the project ; or restart discovery if errored
                    const rediscoveryBody = {
                      reset: health?.readableValue === "HEALTHY" ? false : true,
                    } as ProjectDiscoverRequestBody
                    
                    const discoverRes = await fetch(`/api/projects/${id}/discover`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(rediscoveryBody)
                    })

                    if (discoverRes.ok) {
                      fetchHealth()
                    }
                  } catch (err) {
                    console.error(
                      `${activeBillingOrg.id} ${saraSession.email} ${project.id} Caught error when trying to rediscover a project: ${err}`,
                    )
                  }
                }}
              >
                <HoverCard.Root>
                  <HoverCard.Trigger>
                    <Flex gap="2">
                      {rediscoverButtonEnabled &&
                      (health?.readableValue === "HEALTHY" || !health?.backgroundProjectStatus?.activelyUpdating) ? (
                        <EnabledResyncIcon
                        />
                      ) : (
                        <EnabledResyncIcon
                          color="gray"
                        />
                      )}
                      Refresh Source
                    </Flex>
                  </HoverCard.Trigger>
                  <HoverCard.Content>
                    <ProjectSourceSyncStatus health={health} projectResources={project.dataSourceUris}/>
                  </HoverCard.Content>
                </HoverCard.Root>
              </Button>
            </Flex>
          </Flex>
        </div>
      </RenderableResourceContent>
      <RenderableResourceContent>
        <GoalsManager projectId={id} goals={goals} />
      </RenderableResourceContent>
    </RenderableResource>
  )
}

export default ProjectPageIndex
