'use client'

import React, { useEffect, useState } from 'react'
import { Flex } from '@radix-ui/themes'
import GoalsManager from 'components/goals/goals-manager'
import DisabledResyncIcon from 'components/icons/DisabledResyncIcon'
import EnabledResyncIcon from 'components/icons/EnabledResyncIcon'
import ProjectSourceSyncStatus from 'components/project-status/project-source-sync-status'
import ProjectStatusCard from 'components/project-status/project-status-card'
import SaraLoading from 'components/sara-loading'
import { rediscoverProject } from 'lib/polyverse/backend/backend'
import { isPreviewFeatureEnabled } from 'lib/service-utils'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

import { type SaraSession } from './../../../../../auth'
import RenderableResource from './../../../../../components/renderable-resource/renderable-resource'
import RenderableResourceContent from './../../../../../components/renderable-resource/renderable-resource-content'
import { Button } from './../../../../../components/ui/button'
import {
  type Goal,
  type Project,
  type ProjectHealth,
} from './../../../../../lib/data-model-types'
import { useAppContext } from './../../../../../lib/hooks/app-context'
import CopyToClipboardIcon from 'components/icons/CopyToClipboardIcon'

const ProjectPageIndex = ({ params: { id } }: { params: { id: string } }) => {
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const {
    activeBillingOrg,
    setProjectIdForConfiguration,
    setActiveGoalId,
    activeWorkspaceDetails,
  } = useAppContext()

  const [project, setProject] = useState<Project | null>(null)
  const [health, setHealth] = useState<ProjectHealth | null>(null)
  const [rediscoverButtonEnabled, setRediscoverButtonEnabled] =
    useState<boolean>(true)
  const [goals, setGoals] = useState<Goal[]>([])
  const [copied, setCopied] = useState(false);

  const [toastedInactiveBillingOrg, setToastedInactiveBillingOrg] =
    useState<boolean>(false)

  useEffect(() => {
    if (!activeBillingOrg) {
      return
    }

    if (!saraSession) {
      // just wait until we have a saraSession ready
      return
    }
  }, [activeBillingOrg, saraSession, toastedInactiveBillingOrg])

  // This use effect is to just get the project details...
  useEffect(() => {
    let isMounted = true

    const fetchProjectDeatilsFrequencyMilliseconds = 5000

    const fetchProjectDetails = async () => {
      try {
        const projectRes = await fetch(`/api/projects/${id}`)

        if (!projectRes.ok) {
          const errText = await projectRes.text()

          throw new Error(
            `Failed to get a success response when fetching project '${id}' because: ${errText}`,
          )
        }

        const fetchedProject = (await projectRes.json()) as Project
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

        if (healthRes.ok) {
          const fetchedHealth = (await healthRes.json()) as ProjectHealth
          setHealth(fetchedHealth)

          // we're only going to enable source resynchronization if the project is healthy and already synchronized
          //    no reason to let a user interupt or hijack a synchronization already in progress
          setRediscoverButtonEnabled(fetchedHealth.readableValue === 'HEALTHY')
        } else {
          console.debug(`Failed to get project health`)
        }

        if (isMounted) {
          setTimeout(
            fetchProjectDetails,
            fetchProjectDeatilsFrequencyMilliseconds,
          )
        }
      } catch (err) {
        console.debug(`Failed to fetch project details because: ${err}`)

        if (isMounted) {
          setTimeout(
            fetchProjectDetails,
            fetchProjectDeatilsFrequencyMilliseconds,
          )
        }
      }
    }

    fetchProjectDetails()

    return () => {
      isMounted = false
    }
  }, [id, activeBillingOrg, saraSession])

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
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset icon after 2 seconds
    }, (err) => {
      console.error(`${saraSession.email} Failed to copy ID to clipboard:`, err);
      setCopied(false);
    });
  };

  return (
    <RenderableResource>
      <RenderableResourceContent>
        <div className="my-1 flex justify-between w-full">
          <div className="flex flex-col">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">Project:</h3>
              <p className="mx-2">{project.name}</p>
            </div>
            <div className="my-1 flex items-center">
              <h3 className="text-xs text-gray-500 italic">ID</h3>
              <div className="flex items-center cursor-pointer" onClick={() => copyToClipboard(project.id)}>
                <p className="text-xs text-gray-500 italic ml-2">{project.id}</p>
                <CopyToClipboardIcon copied={copied} />
              </div>
            </div>
            {project.description ? (
              <div className="my-1 flex items-center">
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="mx-2">{project.description}</p>
              </div>
            ) : null}
          </div>
          <Flex direction="column">
            <div className="mr-2">
              <ProjectStatusCard
                health={health}
                lastRefreshedAt={project.lastRefreshedAt}
              />
            </div>

            {isPreviewFeatureEnabled(
              'ProjectSourceSyncStatus',
              saraSession?.email,
            ) && (
              <Flex>
                <div className="mr-2">
                  <ProjectSourceSyncStatus
                    health={health}
                    projectResources={[]}
                  />
                </div>
                <Button
                  variant="ghost"
                  className="hover:bg-red-200"
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
                      await rediscoverProject(
                        activeBillingOrg.id,
                        project.id,
                        saraSession.email,
                      )
                    } catch (err) {
                      console.error(
                        `${activeBillingOrg.id} ${saraSession.email} ${project.id} Caught error when trying to rediscover a project: ${err}`,
                      )
                    }
                  }}
                >
                  <Flex gap="2">
                    {rediscoverButtonEnabled ? (
                      <EnabledResyncIcon />
                    ) : (
                      <DisabledResyncIcon />
                    )}
                    {rediscoverButtonEnabled ? 'Resync Source' : 'Synchronized'}
                  </Flex>
                </Button>
              </Flex>
            )}
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
