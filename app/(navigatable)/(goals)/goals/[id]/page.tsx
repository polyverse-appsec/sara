'use client'

import React, { useEffect, useState } from 'react'

import SaraChat from '../../../../../components/sara-chat/sara-chat'
import { ProjectHealthStatusValue, type GoalPartDeux, ProjectHealthConfigurationState, ProjectHealth } from './../../../../../lib/data-model-types'
import LoadingSpinner from 'components/loading-spinner'
import RenderableResource from 'components/renderable-resource/renderable-resource'
import RenderableResourceContent from 'components/renderable-resource/renderable-resource-content'
import ScrollableResourceList from 'components/scrollable-resource-list/scrollable-resource-list'
import { useAppContext } from 'lib/hooks/app-context'
import CollapsibleRenderableResourceContent from 'components/renderable-resource/collapsible-renderable-resource-content'

const renderHealthIcon = (readableHealthValue: ProjectHealthStatusValue) => {
  if (readableHealthValue === 'UNHEALTHY') {
    return (
      <p title="Unhealthy: Sara is having some trouble learning about your project.">
        🛑
      </p>
    )
  }

  if (readableHealthValue === 'PARTIALLY_HEALTHY') {
    return (
      <p title="Partially Healthy: Sara is still learning about your project, so answers may not be complete.">
        ⚠️
      </p>
    )
  }

  if (readableHealthValue === 'HEALTHY') {
    return (
      <p title="Healthy: Sara has learned about your project code and architecture.">
        ✅
      </p>
    )
  }

  // If we don't know what value it is then render a magnifying glass to signify searching
  return <p>🔎</p>
}

const renderHumanReadableHealthStatus = (
  readableHealthValue: ProjectHealthStatusValue,
) => {
  if (readableHealthValue === 'UNHEALTHY') {
    return (
      <p>
        Sara is having some trouble learning about your project code and
        architecture. Never fear! She will not give up learning and trying to
        help. Please come back soon when she is ready!
      </p>
    )
  }

  if (readableHealthValue === 'PARTIALLY_HEALTHY') {
    return (
      <p>
        Sara is still learning about your project, so she may not have the best
        answers yet. Feel free to ask questions now, or have a cup of tea and
        wait a few minutes for her best answers 🍵😊
      </p>
    )
  }

  if (readableHealthValue === 'HEALTHY') {
    return (
      <p>
        Sara has learned about your project code and architecture. She is fully
        up to speed and happy to answer all your architectural and code
        questions!
      </p>
    )
  }

  return 'Unknown'
}

const renderHumanReadableConfigurationState = (
  configurationState: ProjectHealthConfigurationState,
) => {
  switch (configurationState) {
    case 'UNKNOWN':
      // Don't return a scary string
      return 'Sara has encountered a tear in the fabric of space-time'

    case 'VECTOR_DATA_AVAILABLE':
      return 'Your project has been initialized'
    case 'LLM_CREATED':
      return 'Sara is ready to learn about your project'
    case 'VECTOR_DATA_ATTACHED_TO_LLM':
      return 'Sara is learning about your project'
    case 'VECTOR_DATA_UPDATE_AVAILABLE':
      return 'Sara is updating her knowledge about your project'
    case 'CONFIGURED':
      return 'Sara is fully caught up on your project'

    default:
      // Well we said we wouldn't return a scary string when it was actually in
      // the 'UNKNOWN' state. Lets at least return one here presuming we will
      // never hit it but in the event we haven't handled some state show this
      // string so it could be reported to us via a bug by a customer.
      return 'Sara has crossed the streams... not good'
  }
}

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

const GoalIndex = ({ params: { id } }: { params: { id: string } }) => {
  const { projectIdForConfiguration } = useAppContext()
  const [goal, setGoal] = useState<GoalPartDeux | null>(null)
  const [health, setHealth] = useState<ProjectHealth | null>(null)

  useEffect(() => {
    ;(async () => {
      const goalRes = await fetch(`/api/goals/${id}`)

      if (!goalRes.ok) {
        const errText = await goalRes.text()

        throw new Error(
          `Failed to get a success response when fetching goal '${id}' because: ${errText}`,
        )
      }

      const fetchedGoal = (await goalRes.json()) as GoalPartDeux

      setGoal(fetchedGoal)

      const healthRes = await fetch(`/api/projects/${projectIdForConfiguration}/health`)

      if (healthRes.ok) {
        const fetchedHealth = (await healthRes.json()) as ProjectHealth
        setHealth(fetchedHealth)
      } else {
        console.debug(`Failed to get project health`)
      }

    })()
  }, [id])

  // 03/14/24: We are prepping for a demo and new customer on-boarding next
  // week. As a result we are cutting the usage of this rendered page for now.
  // To make sure it renders we just hardcoded `HEALTHY` into the rendering of
  // the <SaraChat.projectHealth> variable

  return (
    <RenderableResource>
      <RenderableResourceContent>
        <div className="flex flex-col items-center">
          <div className="my-1 flex text-center">
            <p className="text-lg font-semibold">Goal: {goal?.name}</p>
          </div>
          <div className="w-1/2 border-t-2 border-blue-600 my-2"></div>
          {goal?.description ? (
            <div className="my-1 flex text-center">
              {/* <h3 className="text-lg font-semibold">Description</h3> */}
              <p className="mx-2">{goal.description}</p>
            </div>
          ) : null}
        </div>
        </RenderableResourceContent>
        <CollapsibleRenderableResourceContent title={'Project Health'}>
          <div className="my-1">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">Health</h3>
              <div className="mx-2">
                {health ? renderHealthIcon(health.readableValue) : null}
              </div>
            </div>
            {health
              ? renderHumanReadableHealthStatus(health.readableValue)
              : 'Sara is checking her vitals...'}
          </div>
          <div className="my-1">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">Sara Tracker:</h3>
              <p className="mx-2">
                {renderHumanReadableConfigurationState(
                  health ? health.configurationState : 'UNKNOWN',
                )}
              </p>
            </div>
          </div>
      </CollapsibleRenderableResourceContent>
      <RenderableResourceContent>
        {/* Give the appearance of being healthy if we don't know */}
        {renderChatForGoal(
          goal,
          health ? health.readableValue : 'HEALTHY',
        )}
      </RenderableResourceContent>
    </RenderableResource>
  )
}

export default GoalIndex
