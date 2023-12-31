'use client'

import { Chat } from '@/lib/types'

import { useState } from 'react'

import { Treeview } from './ui/treeview'

// TODO: Delete this file
// import { data } from './ui/treeview-data-test'

// TODO: I want to wrap this with a <div> and try to put in the following to make it fit: flex flex-col h-full
// Note that I tried this and it didn't work - made things arguably worse. Look at the elements in the developer tools
// to sus out more of what is going on

type TaskTreeProps = {
    tasks: Chat[]
}

// TODO: Comment
const prepTasksForTreeNodes = (tasks: Chat[]) => tasks.map(({ id, title: content }) => ({ id, content }))

// TODO: Comments
export default function TaskTree({ tasks }: TaskTreeProps) {
    // TODO: 12/30 6:13 PM - Is this controlled state causing a problem? Am I getting new tasks but not re-rendering because I need to use a reducer or something?
    const [selected, select] = useState<string | null>(null)

    const preppedTasks = prepTasksForTreeNodes(tasks)

    console.log(`In <TaskTree> preppedTasks: ${JSON.stringify(preppedTasks)}`)

    // TODO: Need to ensure that tasks objects match that of Node objects in terms of identifiers and stuff on the objs - look at the props
    // export interface Chat extends Record<string, any> {
    //     id: string
    //     title: string
    //     createdAt: Date
    //     userId: string
    //     path: string
    //     messages: Message[]
    //     sharePath?: string
    //   }


    // export type TreeNodeType = {
    //     id: string
    //     name: string
    //     children?: TreeNodeType[]
    //     icon?: ReactNode
    // }

    // TODO: Do I need a <React.Suspense> in here until my tasks are fully loaded?

    // className="w-72 h-full border-[1.5px] border-slate-200 m-4"

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