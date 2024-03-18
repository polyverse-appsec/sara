'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  TaskPartDeux,
  type GoalPartDeux,
  type ProjectPartDeux,
} from '../../lib/data-model-types'
import { Treeview, type TreeNodeType } from './../../components/ui/treeview'

interface NavResourceLoaderProps {
  projectId: string
}

const getGoals = (projectId: string): Promise<GoalPartDeux[]> =>
  new Promise(async (resolve, reject) => {
    try {
      const getGoalsRes = await fetch(`/api/projects/${projectId}/goals`)

      if (!getGoalsRes.ok) {
        const errText = await getGoalsRes.text()

        reject(
          `Goals response returned unsuccessful status because: ${errText}`,
        )

        return
      }

      const goals = (await getGoalsRes.json()) as GoalPartDeux[]

      resolve(goals)
    } catch (error) {
      reject(
        `Request for GET /api/projects/${projectId}/goals failed because: ${error}`,
      )

      return
    }
  })

const getTasks = (goalId: string): Promise<TaskPartDeux[]> =>
  new Promise(async (resolve, reject) => {
    try {
      const getTasksRes = await fetch(`/api/goals/${goalId}/tasks`)

      if (!getTasksRes.ok) {
        const errText = await getTasksRes.text()

        reject(
          `Tasks response returned unsuccessful status because: ${errText}`,
        )

        return
      }

      const tasks = (await getTasksRes.json()) as TaskPartDeux[]

      resolve(tasks)
    } catch (error) {
      reject(
        `Request for GET /api/goals/${goalId}/tasks failed because: ${error}`,
      )

      return
    }
  })

interface NavResource {
  goal: GoalPartDeux
  tasks: TaskPartDeux[]
}

const NavResourceLoader = ({ projectId }: NavResourceLoaderProps) => {
  const router = useRouter()

  const [selectedResource, setSelectedResource] = useState<string | null>(null)

  const [navResourcesByGoalId, setNavResourcesByGoalId] = useState<
    Record<string, NavResource>
  >({})

  useEffect(() => {
    let isMounted = true
    const loadResourcesFrequencyMilliseconds = 10000

    const loadResources = async () => {
      try {
        const goals = await getGoals(projectId)

        const navResourcesByGoalId = goals.reduce(
          (accumulator, goal) => {
            accumulator[goal.id] = {
              goal,
              tasks: [],
            }

            return accumulator
          },
          {} as Record<string, NavResource>,
        )

        const mapTasksToNavResourcesPromises = goals.map(async (goal) => {
          const tasks = await getTasks(goal.id)
          navResourcesByGoalId[goal.id].tasks = tasks
        })

        await Promise.all(mapTasksToNavResourcesPromises)

        setNavResourcesByGoalId(navResourcesByGoalId)
      } catch (error) {
        console.debug(
          `Failed to load resources for project ${projectId} because: ${error}`,
        )
      }

      // Try again all over regardless of failure or success...
      if (isMounted) {
        setTimeout(loadResources, loadResourcesFrequencyMilliseconds)
      }
    }

    loadResources()

    return () => {
      isMounted = false
    }
  }, [])

  if (Object.entries(navResourcesByGoalId).length === 0) {
    return null
  }

  return (
    <Treeview.Root
      value={selectedResource}
      onChange={(resource: string) => {
        // This is a hack for a demo we are having 03/19/24. Our TreeView
        // component is poor in that it can't render any ReactNodes as
        // children - just more TreeViewNodes. What we would like to do is
        // pass a <Link> with a <Label> for the nodes. Since we can't do
        // that we pass the route for the goal as the ID and when an
        // element is clicked we will route to it if it contains the
        // `/goals` URL.
        if (resource.includes(`goals`)) {
          router.push(resource)
        }
      }}
      className="h-full"
    >
      {Object.values(navResourcesByGoalId).map((navResource) => {
        const taskNodes = navResource.tasks.map((task) => ({
          id: task.id,
          content: task.description,
        }))

        return (
          <Treeview.Node
            node={{
              // This is a hack for a demo we are having 03/19/24. Our TreeView
              // component is poor in that it can't render any ReactNodes as
              // children - just more TreeViewNodes. What we would like to do is
              // pass a <Link> with a <Label> for the nodes. Since we can't do
              // that we pass the route for the goal as the ID and when an
              // element is clicked we will route to it if it contains the
              // `/goals` URL.
              id: `/goals/${navResource.goal.id}`,
              content: `Goal: ${navResource.goal.description}`,
              children: taskNodes,
            }}
            key={navResource.goal.id}
          />
        )
      })}
    </Treeview.Root>
  )
}

export default NavResourceLoader
