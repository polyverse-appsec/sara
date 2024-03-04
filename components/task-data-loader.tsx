'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Task } from '../lib/data-model-types'
import { getTasksForProject } from './../app/_actions/get-tasks-for-project'
import { useAppContext } from './../lib/hooks/app-context'
import TaskTree from './task-tree'

type TaskDataLoaderProps = {
  userId: string
}

export function TaskDataLoader({ userId }: TaskDataLoaderProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const {
    chatStreamLastFinishedAt,
    saraConfig: {
      projectConfig: { project, status },
    },
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
      // `project` won't be initialized until:
      // 1) An organization has been selected
      // 2) A repository has been selected
      // 3) Sara has been configured for the selected repository
      //
      // All of the aforementioned steps are represented by the `CONFIGURED`
      // state of the project from the Sara config

      if (status === 'UNCONFIGURED') {
        // If for some reason we just re-rendered and the project isn't
        // configured just render and empty task list
        setTasks([])
        return
      }

      if (status !== 'CONFIGURED' || !project) {
        return
      }

      try {
        const tasks = await getTasksForProject(project)
        setTasks(tasks)
      } catch (err) {
        console.debug(`***** TaskDataLoader - fetchTasks error: ${err}`)
        toast.error('Failed to fetch tasks for project')
      }
    }

    fetchTasks()
  }, [project, status, chatStreamLastFinishedAt])

  // If the user hasn't provided any of their tasks yet then state that
  // otherwise render the task tree.
  return (
    <div className="flex flex-col h-full">
      <h1 className="px-4 py-2 text-xl font-bold text-center text-muted-foreground">
        Tasks for {project?.name ?? 'Selected Repository'}
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
