'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { Flex } from '@radix-ui/themes'
import { getResource } from 'app/saraClient'
import LoadingSpinner from 'components/loading-spinner'
import RenderableResource from 'components/renderable-resource/renderable-resource'
import RenderableResourceContent from 'components/renderable-resource/renderable-resource-content'
import { Button } from 'components/ui/button'

import SaraChat from '../../../../../components/sara-chat/sara-chat'
import {
  ProjectHealth,
  ProjectHealthStatusValue,
  type GoalPartDeux,
} from './../../../../../lib/data-model-types'

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
  const [goal, setGoal] = useState<GoalPartDeux | null>(null)
  const [health, setHealth] = useState<ProjectHealth | null>(null)

  useEffect(() => {
    ;(async () => {
      const goal = await getResource<GoalPartDeux>(
        `/goals/${id}`,
        `Failed to get a success response when fetching goal '${id}'`,
      )

      setGoal(goal)

      const health = await getResource<ProjectHealth>(
        `/projects/${goal.parentProjectId}/health`,
        `Failed to get project health for '${goal.parentProjectId}' for goal '${id}'`,
      )

      setHealth(health)
    })()
  }, [id])

  if (!goal) {
    return null
  }

  // 03/14/24: We are prepping for a demo and new customer on-boarding next
  // week. As a result we are cutting the usage of this rendered page for now.
  // To make sure it renders we just hardcoded `HEALTHY` into the rendering of
  // the <SaraChat.projectHealth> variable

  return (
    <RenderableResource>
      <RenderableResourceContent>
        <Button>
          <Link href={`/projects/${goal.parentProjectId}`}>
            <Flex align="center">
              <ArrowLeftIcon className="mr-2" />
              Back to Project
            </Flex>
          </Link>
        </Button>
        <div className="my-1 flex justify-between w-full">
          <div className="flex flex-col">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">Goal:</h3>
              <p className="mx-2">{goal.name}</p>
            </div>
            <div className="my-1 flex items-center">
              <h3 className="text-xs text-gray-500 italic">ID</h3>
              <p className="text-xs text-gray-500 italic ml-2">{goal.id}</p>
            </div>
            {goal.description ? (
              <div className="my-1 flex items-center">
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="mx-2">{goal.description}</p>
              </div>
            ) : null}
            {goal.acceptanceCriteria ? (
              <div className="my-1 flex items-center">
                <h3 className="text-lg font-semibold">Acceptance Criteria</h3>
                <p className="mx-2">{goal.acceptanceCriteria}</p>
              </div>
            ) : null}
          </div>
        </div>
      </RenderableResourceContent>
      <RenderableResourceContent>
        {/* Give the appearance of being healthy if we don't know */}
        {renderChatForGoal(goal, health ? health.readableValue : 'HEALTHY')}
      </RenderableResourceContent>
    </RenderableResource>
  )
}

export default GoalIndex
