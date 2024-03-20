'use client'

import React, { useEffect, useState } from 'react'

import SaraChat from '../../../../../components/sara-chat/sara-chat'
import { ProjectHealthStatusValue, type GoalPartDeux, ProjectHealth } from './../../../../../lib/data-model-types'
import LoadingSpinner from 'components/loading-spinner'
import RenderableResource from 'components/renderable-resource/renderable-resource'
import RenderableResourceContent from 'components/renderable-resource/renderable-resource-content'
import { useAppContext } from 'lib/hooks/app-context'
import CollapsibleRenderableResourceContent from 'components/renderable-resource/collapsible-renderable-resource-content'

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
        <CollapsibleRenderableResourceContent title={'Goal Information'}>
          <div className="my-1">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">Acceptance Criteria</h3>
              <div className="mx-2">
                {goal?.acceptanceCriteria ? goal.acceptanceCriteria : 'None specified'}
              </div>
            </div>
          </div>
          <div className="my-1">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">Number of tasks</h3>
              <p className="mx-2">
                {goal?.taskIds ? goal.taskIds.length : 0}
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
