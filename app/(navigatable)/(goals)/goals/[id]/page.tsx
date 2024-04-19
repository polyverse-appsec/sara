'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Flex } from '@radix-ui/themes'
import { getResource } from 'app/saraClient'
import CopyToClipboardIcon from 'components/icons/CopyToClipboardIcon'
import RenderableResource from 'components/renderable-resource/renderable-resource'
import RenderableResourceContent from 'components/renderable-resource/renderable-resource-content'
import RenderableSaraChatResourceContent from 'components/sara-chat/renderable-sara-chat-resource-content'
import { useAppContext } from 'lib/hooks/app-context'
import { useSession } from 'next-auth/react'

import { type SaraSession } from './../../../../../auth'
import SaraLoading from './../../../../../components/sara-loading'
import {
  type Goal,
  type ProjectHealth,
} from './../../../../../lib/data-model-types'

const GoalIndex = ({ params: { id } }: { params: { id: string } }) => {
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const {
    setProjectIdForConfiguration,
    setActiveGoalId,
    activeWorkspaceDetails,
  } = useAppContext()

  const [goal, setGoal] = useState<Goal | null>(null)
  const [health, setHealth] = useState<ProjectHealth | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!saraSession) {
      // just wait until we have a saraSession ready
      return
    }
  }, [saraSession])

  useEffect(() => {
    ;(async () => {
      const goal = await getResource<Goal>(
        `/goals/${id}`,
        `Failed to get a success response when fetching goal '${id}'`,
      )

      setGoal(goal)

      const health = await getResource<ProjectHealth>(
        `/projects/${goal.parentProjectId}/health`,
        `Failed to get project health for '${goal.parentProjectId}' for goal '${id}'`,
      )

      setHealth(health)

      const project = await getResource<Goal>(
        `/projects/${goal.parentProjectId}`,
        `Failed to get a success response when fetching parent project for goal '${id}'`,
      )
      setProjectIdForConfiguration(project.id)
    })()
  }, [id, setProjectIdForConfiguration])

  if (!saraSession) {
    return <SaraLoading />
  }

  if (
    (activeWorkspaceDetails && id !== activeWorkspaceDetails.goalId) ||
    !activeWorkspaceDetails
  ) {
    setActiveGoalId(id)
  }

  if (!goal) {
    return <SaraLoading />
  }

  // 03/14/24: We are prepping for a demo and new customer on-boarding next
  // week. As a result we are cutting the usage of this rendered page for now.
  // To make sure it renders we just hardcoded `HEALTHY` into the rendering of
  // the <SaraChat.projectHealth> variable

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
        <button className="btn-blue text-sm">
          <Link href={`/projects/${goal.parentProjectId}`}>
            <Flex align="center">
              <ArrowLeftIcon className="mr-2" />
              Back to Project
            </Flex>
          </Link>
        </button>
        <div className="my-1 flex justify-between w-full">
          <div className="flex flex-col">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">Goal:</h3>
              <p className="mx-2">{goal.name}</p>
            </div>
            <div className="my-1 flex items-center">
              <h3 className="text-xs text-gray-500 italic">ID</h3>
              <p className="text-xs text-gray-500 italic ml-2">{goal.id}</p>
              <Tooltip.Root>
                <Tooltip.Provider>
                  <Tooltip.Trigger
                    className="flex items-center cursor-pointer"
                    onClick={() => copyToClipboard(goal.id)}
                  >
                    <CopyToClipboardIcon copied={copied} color="#6B7280" />
                  </Tooltip.Trigger>
                  <Tooltip.Content
                    side="left"
                    align="end"
                    className="clipboardCopyToolTip"
                  >
                    Copy Goal Id
                  </Tooltip.Content>
                </Tooltip.Provider>
              </Tooltip.Root>
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
      <RenderableSaraChatResourceContent<Goal>
        projectHealth={health ? health.readableValue : 'HEALTHY'}
        chatableResourceUrl={`/api/goals/${goal.id}`}
      />
    </RenderableResource>
  )
}

export default GoalIndex
