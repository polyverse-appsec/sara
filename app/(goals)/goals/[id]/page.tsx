'use client'

import React, { useEffect, useState } from 'react'

import SaraChat from '../../../../components/sara-chat/sara-chat'
import { type GoalPartDeux } from './../../../../lib/data-model-types'

const GoalIndex = ({ params: { id } }: { params: { id: string } }) => {
  const [goal, setGoal] = useState<GoalPartDeux | null>(null)

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
    })()
  }, [id])

  // 03/14/24: We are prepping for a demo and new customer on-boarding next
  // week. As a result we are cutting the usage of this rendered page for now.
  // To make sure it renders we just hardcoded `HEALTHY` into the rendering of
  // the <SaraChat.projectHealth> variable

  return (
    <div className="max-h-screen overflow-auto">
      <div className="flex-1 flex-col gap-4 p-10 text-2xl">
        <div className="bg-background shadow-md rounded-lg p-6">
          <div className="text-center text-base my-1">
            <h3 className="text-lg font-semibold">Goal Name</h3>
            <p>{goal?.name}</p>
          </div>
          <div className="text-center text-base my-1">
            <h3 className="text-lg font-semibold">Goal Description</h3>
            <p>{goal?.description}</p>
          </div>
          {goal?.chatId ? (
            <SaraChat
              projectHealth="HEALTHY"
              chatQueriesUrl={`/api/goals/${goal.id}/chats/${goal.chatId}/chat-queries`}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default GoalIndex
