'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExclamationTriangleIcon, HeartFilledIcon } from '@radix-ui/react-icons'
import toast from 'react-hot-toast'

import { Button } from './../../../../components/ui/button'
import {
  type GoalPartDeux,
  type ProjectHealth,
  type ProjectHealthStatusValue,
  type ProjectPartDeux,
} from './../../../../lib/data-model-types'

const renderHealthIcon = (readableHealthValue: ProjectHealthStatusValue) => {
  if (readableHealthValue === 'UNHEALTHY') {
    return <HeartFilledIcon className="w-4 h-4 text-red-500" />
  }

  if (readableHealthValue === 'PARTIALLY_HEALTHY') {
    return <HeartFilledIcon className="w-4 h-4 text-yellow-500" />
  }

  if (readableHealthValue === 'HEALTHY') {
    return <HeartFilledIcon className="w-4 h-4 text-green-500" />
  }

  // If we don't know what value it is then render an icon as if it was
  // unhealthy
  return <HeartFilledIcon className="w-4 h-4 text-red-500" />
}

const renderHumanReadableHealthStatus = (
  readableHealthValue: ProjectHealthStatusValue,
) => {
  if (readableHealthValue === 'UNHEALTHY') {
    return 'Unhealthy'
  }

  if (readableHealthValue === 'PARTIALLY_HEALTHY') {
    return 'Partially Healthy'
  }

  if (readableHealthValue === 'HEALTHY') {
    return 'Healthy'
  }

  return 'Unknown'
}

const ProjectPageIndex = ({ params: { id } }: { params: { id: string } }) => {
  const router = useRouter()

  const [project, setProject] = useState<ProjectPartDeux | null>(null)
  const [goals, setGoals] = useState<GoalPartDeux[] | null>(null)
  const [health, setHealth] = useState<ProjectHealth | null>(null)

  const [deleteButtonEnabled, setDeleteButtonEnabled] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    const fetchProjectDetails = async () => {
      try {
        const projectRes = await fetch(`/api/projects/${id}`)

        if (!projectRes.ok) {
          const errText = await projectRes.text()

          throw new Error(
            `Failed to get a success response when fetching project '${id}' because: ${errText}`,
          )
        }

        const fetchedProject = (await projectRes.json()) as ProjectPartDeux
        setProject(fetchedProject)

        // Best effort collect goals associated with the project and its health
        const goalsRes = await fetch(`/api/projects/${id}/goals`)

        if (goalsRes.ok) {
          const fetchedGoals = (await goalsRes.json()) as GoalPartDeux[]
          setGoals(fetchedGoals)
        } else {
          console.debug(`Failed to get project goals`)
        }

        const healthRes = await fetch(`/api/projects/${id}/health`)

        if (healthRes.ok) {
          const fetchedHealth = (await healthRes.json()) as ProjectHealth
          setHealth(fetchedHealth)
        } else {
          console.debug(`Failed to get project health`)
        }

        console.debug(`***** COMPELTED PROJECT FETCH LOOP`)

        if (isMounted) {
          setTimeout(fetchProjectDetails, 5000)
        }
      } catch (err) {
        console.debug(`Failed to fetch project details because: ${err}`)

        if (isMounted) {
          setTimeout(fetchProjectDetails, 5000)
        }
      }
    }

    fetchProjectDetails()

    return () => {
      isMounted = false
    }
  }, [])

  if (!project) {
    return null
  }

  return (
    <div className="flex-1 flex-col gap-4 p-10 text-2xl font-bold">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="text-center text-base my-1">
          <h3 className="text-lg font-semibold">Name</h3>
          <p>{project.name}</p>
        </div>
        <div className="text-center text-base my-1">
          <h3 className="text-lg font-semibold">Description</h3>
          <p>{project.description}</p>
        </div>
        <div className="text-center text-base my-1">
          <h3 className="text-lg font-semibold">Health Status</h3>
          <div className="flex items-center">
            {renderHealthIcon(health ? health.readableValue : 'UNHEALTHY')}
            <p>
              {renderHumanReadableHealthStatus(
                health ? health.readableValue : 'UNHEALTHY',
              )}
            </p>
          </div>
        </div>
        {!goals ? null : (
          <div className="border border-gray-300 p-2 text-base my-1 rounded-lg flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-center">Goals</h3>
            {Object.entries(goals).map(([goalKey, goalValue]) => (
              <div
                key={goalValue.id}
                className="block transform transition rounded-lg"
              >
                <Link href={`/goals/${goalValue.id}`}>
                  <div className="hover:bg-orange-200 border border-gray-300 rounded-lg my-1 p-1">
                    <h3 className="text-md font-semibold text-center">
                      Goal {goalKey}: {goalValue.name}
                    </h3>
                  </div>
                </Link>
              </div>
            ))}
            <Button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-2">
              Create New Goal
            </Button>
          </div>
        )}
        <Button
          variant="ghost"
          className="bg-red-500 hover:bg-red-200"
          onClick={async (e) => {
            e.preventDefault()

            setDeleteButtonEnabled(false)

            try {
              const res = await fetch(`/api/projects/${project.id}`, {
                method: 'DELETE',
              })

              if (!res.ok) {
                const errText = await res.text()

                console.debug(`Failed to delete a project because: ${errText}`)

                toast.error(`Failed to delete project`)

                setDeleteButtonEnabled(true)
                return
              }

              router.push(`/projects`)
            } catch (err) {
              console.debug(
                `Caught error when trying to delete a project: ${err}`,
              )

              setDeleteButtonEnabled(true)

              toast.error(`Failed to delete project`)
            }
          }}
        >
          {deleteButtonEnabled ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              className="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
          )}
          {deleteButtonEnabled ? 'Delete' : 'Deleting'}
        </Button>
      </div>
    </div>
  )
}

export default ProjectPageIndex
