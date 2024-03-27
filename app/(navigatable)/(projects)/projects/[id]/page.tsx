'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import GoalsManager from 'components/goals/goals-manager'
import ProjectStatusCard from 'components/project-status/project-status-card'
import { rediscoverProject } from 'lib/polyverse/backend/backend'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

import SaraChat from '../../../../../components/sara-chat/sara-chat'
import { type SaraSession } from './../../../../../auth'
import LoadingSpinner from './../../../../../components/loading-spinner'
import RenderableResource from './../../../../../components/renderable-resource/renderable-resource'
import RenderableResourceContent from './../../../../../components/renderable-resource/renderable-resource-content'
import { Button } from './../../../../../components/ui/button'
import {
  type GoalPartDeux,
  type ProjectHealth,
  type ProjectHealthStatusValue,
  type ProjectPartDeux,
} from './../../../../../lib/data-model-types'
import { useAppContext } from './../../../../../lib/hooks/app-context'

const renderChatForGoal = (
  goal: GoalPartDeux | null,
  projectHealth: ProjectHealthStatusValue,
) => {
  if (!goal) {
    return (
      <div className="flex">
        <h3 className="text-lg font-semibold text-center">
          Building initial advice for your Goal
        </h3>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <SaraChat
      projectHealth={projectHealth}
      chatableResourceUrl={`/api/goals/${goal.id}`}
      existingChatId={goal.chatId}
    />
  )
}

const ProjectPageIndex = ({ params: { id } }: { params: { id: string } }) => {
  const router = useRouter()
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const { activeBillingOrg, setProjectIdForConfiguration } = useAppContext()

  const [project, setProject] = useState<ProjectPartDeux | null>(null)
  const [health, setHealth] = useState<ProjectHealth | null>(null)
  const [rediscoverButtonEnabled, setRediscoverButtonEnabled] =
    useState<boolean>(true)
  const [goals, setGoals] = useState<GoalPartDeux[]>([])
  const [goalForChat, setGoalForChat] = useState<GoalPartDeux | null>(null)

  // This use effect is to just get the project details...
  useEffect(() => {
    let isMounted = true

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
      } catch (error) {
        toast.error(`Failed to fetch user status: ${error}`)
      }
    }

    fetchUserStatus()

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

        const fetchedProject = (await projectRes.json()) as ProjectPartDeux
        setProject(fetchedProject)

        // Best effort collect goals associated with the project and its health
        const goalsRes = await fetch(`/api/projects/${id}/goals`)

        if (goalsRes.ok) {
          const fetchedGoals = (await goalsRes.json()) as GoalPartDeux[]

          // If we don't have a goal for chat then just take the first goal with
          // if it has a chat ID. This is making the assumption that the first
          // goal is the default goal and it has been configured for a chat.
          if (
            fetchedGoals &&
            fetchedGoals.length !== 0 &&
            fetchedGoals[0].chatId
          ) {
            setGoalForChat(fetchedGoals[0])
          }

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

  if (!project) {
    return null
  }

  // Once we have loaded our data set the project that ought to be actively
  // refreshed
  setProjectIdForConfiguration(project.id)

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
              <p className="text-xs text-gray-500 italic ml-2">{project.id}</p>
            </div>
            {project.description ? (
              <div className="my-1 flex items-center">
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="mx-2">{project.description}</p>
              </div>
            ) : null}
          </div>
          <div className="flex">
            <div className="mr-2">
              <ProjectStatusCard
                health={health}
                lastRefreshedAt={project.lastRefreshedAt}
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
                  toast.error(
                    'Required billing and user information is missing.',
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
              {rediscoverButtonEnabled ? (
                // Enabled state SVG
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-refresh-cw"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0114.98-3.51l-1.42 1.42A7 7 0 005.67 9H3.51z"></path><path d="M20.49 15a9 9 0 0114.98 3.51l1.42-1.42A7 7 0 0018.33 15h1.16z"></path></svg>
                  ) : (
                // Disabled state SVG with corrected opacity style
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-refresh-cw" style={{ opacity: 0.5 }}><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0114.98-3.51l-1.42 1.42A7 7 0 005.67 9H3.51z"></path><path d="M20.49 15a9 9 0 0114.98 3.51l1.42-1.42A7 7 0 0018.33 15h1.16z"></path></svg>
                )}
              {rediscoverButtonEnabled ? 'Resync Source' : 'Synchronized'}
            </Button>
          </div>
        </div>
      </RenderableResourceContent>
      <RenderableResourceContent>
        <GoalsManager projectId={id} goals={goals} />
      </RenderableResourceContent>
      <RenderableResourceContent>
        {/* Give the appearance of being healthy if we don't know */}
        {renderChatForGoal(
          goalForChat,
          health ? health.readableValue : 'HEALTHY',
        )}
      </RenderableResourceContent>
    </RenderableResource>
  )
}

export default ProjectPageIndex
