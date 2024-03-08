'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import {
    GoalPartDeux,
    type ProjectPartDeux,
} from './../../../../lib/data-model-types'
import Link from 'next/link'

const GoalIndex = ({ params: { id } }: { params: { id: string } }) => { 
    const [selectedGoal, setSelectedGoal] = useState<GoalPartDeux | null>(null)

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
    
          setSelectedGoal(fetchedGoal)
        })()


      }, [])
    

    return (
        <div className="flex-1 flex-col gap-4 p-10 text-2xl font-bold">
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="text-center text-base my-1">
                    <h3 className="text-lg font-semibold">Goal Name</h3>
                    <p>{selectedGoal?.name}</p>
                </div>
                <div className="text-center text-base my-1">
                    <h3 className="text-lg font-semibold">Goal Description</h3>
                    <p>{selectedGoal?.description}</p>
                </div>
            </div>
        </div>
    )
}

export default GoalIndex