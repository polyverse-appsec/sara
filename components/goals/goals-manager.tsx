'use client'

import Link from 'next/link'

import ScrollableResourceList from './../../components/scrollable-resource-list/scrollable-resource-list'
import { Button } from './../../components/ui/button'
import { type GoalPartDeux } from './../../lib/data-model-types'

interface GoalsManagerProps {
  projectId: string
  goals: GoalPartDeux[]
}

const GoalsManager = ({ projectId, goals }: GoalsManagerProps) => {
  return (
    <>
      <div className="my-1 flex justify-between w-full">
        <h3 className="text-lg font-semibold">Goals</h3>
        <Button
          variant="ghost"
          className=" bg-green-200"
          onClick={async (e) => {
            e.preventDefault()
          }}
        >
          <Link href={`/projects/${projectId}/goals/create`}>
            Create New Goal
          </Link>
        </Button>
      </div>
      <ScrollableResourceList goals={goals} />
    </>
  )
}

export default GoalsManager
