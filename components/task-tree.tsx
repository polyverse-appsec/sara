'use client'

import { useState } from 'react'

import { Treeview } from './ui/treeview'

import { Task } from '@/lib/dataModelTypes'

// TODO: Delete this file
// import { data } from './ui/treeview-data-test'

type TaskTreeProps = {
    tasks: Task[]
}

const prepTasksForTreeNodes = (tasks: Task[]) => tasks.map(({ id, title }) => ( { id: id, content: title }))

export default function TaskTree({ tasks }: TaskTreeProps) {
    const [selected, select] = useState<string | null>(null)

    const preppedTasks = prepTasksForTreeNodes(tasks)

    // Our tree is a controlled component. We use 'value' as the selected item
    // in the tree and 'onChange' is how we select it. For more on controlled
    // components see: https://www.joshwcomeau.com/react/data-binding/
    return (
        <Treeview.Root
            value={selected}
            onChange={select}
        >
            {preppedTasks.map(preppedTask => (
                <Treeview.Node node={preppedTask} key={preppedTask.id} />
            ))}
        </Treeview.Root>
    )
}