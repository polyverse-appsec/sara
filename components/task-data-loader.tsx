'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Chat, Task } from '@/lib/dataModelTypes'
import { useAppContext } from '@/lib/hooks/app-context'
import { getTasksAssociatedWithProject } from '@/app/actions'

import TaskTree from './task-tree'

type TaskDataLoaderProps = {
  userId: string
}

export function TaskDataLoader({ userId }: TaskDataLoaderProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const {
    selectedProject,
    selectedActiveTask,
    tasksLastGeneratedAt,
    selectedActiveChat,
  } = useAppContext()

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
        return
      }

      try {
        const tasks = await getTasksAssociatedWithProject(selectedProject)
        setTasks(tasks)
      } catch (err) {
        toast.error('Failed to fetch tasks for project')
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
