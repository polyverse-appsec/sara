'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, Flex, Heading } from '@radix-ui/themes'
import toast from 'react-hot-toast'

import { deleteResource } from './../../app/saraClient'
import ScrollableGoalsTable from './../../components/goals/scrollable-goals-table'
import { type Goal } from './../../lib/data-model-types'
import { use } from 'chai'
import { TrashIcon } from '@radix-ui/react-icons'

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
    setDeleteGoalsButtonEnabled(true)

    setCheckedGoalIds(newCheckedGoalIds)
  }

  useEffect(() => {
    if (checkedGoalIds.length === 0) {
      setDeleteGoalsButtonEnabled(false)
    } else {
      setDeleteGoalsButtonEnabled(true)
    }
  } , [checkedGoalIds])

  const handleGoalUnchecked = (uncheckedGoalId: string) => {
    const newCheckedGoalIds = [
      ...checkedGoalIds.filter(
        (checkedGoalId) => checkedGoalId !== uncheckedGoalId,
      ),
    ]
    if (newCheckedGoalIds.length === 0) {
      setDeleteGoalsButtonEnabled(false)
    }

    setCheckedGoalIds(newCheckedGoalIds)
  }

  return (
    <Flex
      direction="column"
      gapY="3"
      className="grow overflow-autos"
      style={{ minHeight: '50vh' }}
    >
      <Flex justify="between">
        <Heading as="h3" weight="medium">
          Goals
        </Heading>
        <Button
          className="btn-blue hover:bg-blue-700 hover:text-white transition duration-300"
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
          className=
            {deleteGoalsButtonEnabled
              ? 'btn-red'
              : 'bg-gray-500 hover:cursor-not-allowed'
            }
          disabled={!deleteGoalsButtonEnabled}
          onClick={async () => {
            setDeleteGoalsButtonEnabled(false)

            // If someone is just spamming the delete button then just return.
            // This ought to be false after the first time the button is
            // clicked so check for that state.
            if (!deleteGoalsButtonEnabled) {
              return
            }

            // add a popup confirmation dialog

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
          Delete Goals <TrashIcon />
        </Button>
      </Flex>
    </Flex>
  )
}

export default GoalsManager
