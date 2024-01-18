'use client'
import { clearChats, getTasksAssociatedWithProject } from '@/app/actions'

import TaskTree from './task-tree'

import Link from 'next/link'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

import { IconPlus } from '@/components/ui/icons'

import { ThemeToggle } from '@/components/theme-toggle'
import { ClearHistory } from '@/components/clear-history'
import { useAppContext } from '@/lib/hooks/app-context'
import { Task, Chat } from '@/lib/dataModelTypes'
import { use, useState, useEffect } from 'react'

type TaskDataLoaderProps = {
  userId: string
}

//TODO this is temporary until we hook into the real task db
const convertChatToTask = ({ id, title, createdAt, userId }: Chat): Task => ({
  id,
  title,
  description: title,
  createdAt,
  userId,
  projectId: 'temporary repository id'
})

export function TaskDataLoader({ userId }: TaskDataLoaderProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const {
    selectedProject,
    selectedActiveTask,
    tasksLastGeneratedAt,
    selectedActiveChat
  } = useAppContext()

  console.log(
    `<TaskDataLoader> render - tasksLastGeneratedAt: ${tasksLastGeneratedAt}`
  )
  console.log(
    `<TaskDataLoader> render - selectedActiveChat.userID: ${selectedActiveChat?.userId}`
  )

  // Effects let you specify side effects that is caused by the rendering
  // itself, rather than a particular event.
  //
  // Everytime the component renders React will update the screen and then run
  // the code inside 'useEffect()'. Note that by default this will run after
  // every render. Setting state triggers rendering so it is possible to find
  // yourself in an infinite loop.
  //
  // To prevent re-rendering you can provide dependencies to the 'useEffect()'
  // function. To learn more about them see:
  // https://react.dev/learn/synchronizing-with-effects
  useEffect(() => {
    async function fetchTasks() {
      if (!selectedProject?.name) {
        console.log(`Aborting task fetch since no repo selected`)
        return
      }

      try {
        const tasks = await getTasksAssociatedWithProject(selectedProject)
        console.log(`***** Retrieved tasks: ${JSON.stringify(tasks)}`)
        setTasks(tasks)
      } catch (err) {
        console.error('***** Error fetching tasks:', err)
      }
    }
    fetchTasks()
  }, [selectedProject, tasksLastGeneratedAt])

  // If the user hasn't provided any of their tasks yet then state that
  // otherwise render the task tree.
  return (
    <div className="flex flex-col h-full">
      <h1 className="px-4 py-2 text-xl font-bold text-center text-muted-foreground">
        Tasks for {selectedProject?.name ?? 'Selected Repository'}
      </h1>
      {
      /*<div className="px-2 my-4">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-10 w-full justify-start bg-zinc-50 px-4 shadow-none transition-colors hover:bg-zinc-200/40 dark:bg-zinc-900 dark:hover:bg-zinc-300/10'
          )}
        >
          <IconPlus className="-translate-x-2 stroke-2" />
          New Task
        </Link>
      </div>*/
      }
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              {tasks?.length ? (
                <div className="space-y-2 px-2">
                  <TaskTree tasks={tasks} />
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No task history
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
