'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { NodeRendererProps, Tree } from 'react-arborist'

import {
  type GoalPartDeux,
  type TaskPartDeux,
} from '../../lib/data-model-types'

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

type NavigatableResourceTypes = 'GOAL' | 'TASK'

interface NavigatableResource {
  id: string
  name: string
  type: NavigatableResourceTypes
  children?: NavigatableResource[]
}

const renderGoalIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
    />
  </svg>
)

const renderTaskIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
    />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M6 6h.008v.008H6V6Z"
    />
  </svg>
)

const renderNodeLink = (navigatableResource: NavigatableResource) =>
  navigatableResource.type === 'GOAL' ? (
    <Link href={`/goals/${navigatableResource.id}`}>
      {navigatableResource.name}
    </Link>
  ) : (
    navigatableResource.name
  )

const renderNode = ({
  node,
  style,
  dragHandle,
}: NodeRendererProps<NavigatableResource>) => {
  return (
    <div
      style={{
        ...style,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
      ref={dragHandle}
    >
      <div className="flex">
        <span>
          {node.data.type === 'GOAL' ? renderGoalIcon() : renderTaskIcon()}
        </span>
        <span>{renderNodeLink(node.data)}</span>
      </div>
    </div>
  )
}

const NavResourceLoader = ({ projectId }: NavResourceLoaderProps) => {
  const [navResourceTree, setNavResourceTree] = useState<NavigatableResource[]>(
    [],
  )

  useEffect(() => {
    let isMounted = true
    const loadResourcesFrequencyMilliseconds = 10000

    const loadResources = async () => {
      try {
        const goals = await getGoals(projectId)

        const mapNavResourceTreePromises = goals.map(async (goal) => {
          const tasks = await getTasks(goal.id)

          return {
            id: goal.id,
            name: goal.name,
            type: 'GOAL',
            children: tasks.map(
              (task) =>
                ({
                  id: task.id,
                  name: task.name,
                  type: 'TASK',
                  children: [],
                }) as NavigatableResource,
            ),
          } as NavigatableResource
        })

        const navResourceTree = await Promise.all(mapNavResourceTreePromises)

        setNavResourceTree(navResourceTree)
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

  // Note that our `<Tree>` is a controlled component since we pass our goals
  // and tasks in through `data`. We need to eventually add handlers to it if
  // we want to enable any of its functionality.
  return <Tree data={navResourceTree}>{renderNode}</Tree>
}

export default NavResourceLoader
