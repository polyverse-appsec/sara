'use client'

import Link from 'next/link'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { Table } from '@radix-ui/themes'

import { type GoalPartDeux } from './../../lib/data-model-types'

interface ScrollableResourceListProps {
  goals: GoalPartDeux[]
}

const renderGoals = (goals: GoalPartDeux[]) => {
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
        </Table.Row>
      </>
    )
  })
}

const ScrollableResourceList = ({ goals }: ScrollableResourceListProps) => {
  return (
    <ScrollArea.Root className="h-40 overflow-auto">
      <ScrollArea.Viewport>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Last Updated</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>{renderGoals(goals)}</Table.Body>
        </Table.Root>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical" />
    </ScrollArea.Root>
  )
}

export default ScrollableResourceList
