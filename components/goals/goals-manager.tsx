'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Flex, Heading } from '@radix-ui/themes'
import toast from 'react-hot-toast'

import { deleteResource } from './../../app/saraClient'
import ScrollableGoalsTable from './../../components/goals/scrollable-goals-table'
import { type Goal } from './../../lib/data-model-types'

interface GoalsManagerProps {
  projectId: string
  goals: Goal[]
}

const GoalsManager = ({ projectId, goals }: GoalsManagerProps) => {
  const [checkedGoalIds, setCheckedGoalIds] = useState<string[]>([])
  const [deleteGoalsButtonEnabled, setDeleteGoalsButtonEnabled] =
    useState<boolean>(true)

  const handleGoalChecked = (checkedGoalId: string) => {
    const newCheckedGoalIds = [...checkedGoalIds]
    newCheckedGoalIds.push(checkedGoalId)

    setCheckedGoalIds(newCheckedGoalIds)
  }

  const handleGoalUnchecked = (uncheckedGoalId: string) => {
    const newCheckedGoalIds = [
      ...checkedGoalIds.filter(
        (checkedGoalId) => checkedGoalId !== uncheckedGoalId,
      ),
    ]

    setCheckedGoalIds(newCheckedGoalIds)
  }

  return (
    <Flex direction="column" gapY="3">
      <Flex justify="between">
        <Heading as="h3" weight="medium">
          Goals
        </Heading>
        <Button
          color="green"
          onClick={async (e) => {
            e.preventDefault()
          }}
        >
          <Link href={`/projects/${projectId}/goals/create`}>
            Create New Goal
          </Link>
        </Button>
      </Flex>
      <ScrollableGoalsTable
        goals={goals}
        handleGoalChecked={handleGoalChecked}
        handleGoalUnchecked={handleGoalUnchecked}
      />
      <Flex direction="row-reverse">
        <Button
          color="red"
          onClick={async () => {
            setDeleteGoalsButtonEnabled(false)

            // If someone is just spamming the delete button then just return.
            // This ought to be false after the first time the button is
            // clicked so check for that state.
            if (!deleteGoalsButtonEnabled) {
              return
            }

            try {
              const deleteGoalPromises = checkedGoalIds.map((goalId) =>
                deleteResource(
                  `/goals/${goalId}`,
                  'Request to delete goal failed',
                ),
              )

              await Promise.all(deleteGoalPromises)
            } catch (error) {
              toast.error(`Failed to delete goal because: ${error}`)
            }
            setDeleteGoalsButtonEnabled(true)
          }}
        >
          Delete Goals
        </Button>
      </Flex>
    </Flex>
  )
}

export default GoalsManager
