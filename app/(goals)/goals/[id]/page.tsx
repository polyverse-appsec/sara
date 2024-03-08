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
  }, [])

  return (
    <div className="max-h-screen overflow-auto">
      <div className="flex-1 flex-col gap-4 p-10 text-2xl font-bold">
        <div className="bg-white shadow-md rounded-lg p-6">
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
              chatQueriesUrl={`/api/goals/${goal.id}/chats/${goal.chatId}/chat-queries`}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default GoalIndex
