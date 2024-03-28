'use client'

import Link from 'next/link'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { Checkbox, Table } from '@radix-ui/themes'

import { type GoalPartDeux } from './../../lib/data-model-types'

interface ScrollableGoalsTableProps {
  goals: GoalPartDeux[]
  handleGoalChecked: null | ((checkedGoalId: string) => void)
  handleGoalUnchecked: null | ((uncheckedGoalId: string) => void)
}

const renderGoals = (
  goals: GoalPartDeux[],
  handleGoalChecked: null | ((checkedGoalId: string) => void),
  handleGoalUnchecked: null | ((uncheckedGoalId: string) => void),
) => {
  return goals.map((goal) => {
    return (
      <>
        <Table.Row>
          <Table.RowHeaderCell>
            <Link href={`/goals/${goal.id}`}>{goal.name}</Link>
          </Table.RowHeaderCell>
          <Table.Cell>{goal.status}</Table.Cell>
          <Table.Cell>
            {new Date(goal.createdAt).toLocaleDateString()}
          </Table.Cell>
          <Table.Cell>
            {new Date(goal.lastUpdatedAt).toLocaleDateString()}
          </Table.Cell>
          <Table.Cell>
            <Checkbox
              onCheckedChange={(checked) => {
                if (checked && handleGoalChecked) {
                  handleGoalChecked(goal.id)
                }

                if (!checked && handleGoalUnchecked) {
                  handleGoalUnchecked(goal.id)
                }
              }}
            />
          </Table.Cell>
        </Table.Row>
      </>
    )
  })
}

const ScrollableGoalsTable = ({
  goals,
  handleGoalChecked,
  handleGoalUnchecked,
}: ScrollableGoalsTableProps) => {
  return (
    <ScrollArea.Root className="h-40 overflow-auto">
      <ScrollArea.Viewport>
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Last Updated</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell />
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {renderGoals(goals, handleGoalChecked, handleGoalUnchecked)}
          </Table.Body>
        </Table.Root>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical" />
    </ScrollArea.Root>
  )
}

export default ScrollableGoalsTable
