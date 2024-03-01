'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Joi from 'joi'
import toast from 'react-hot-toast'

import { Button } from './../../../../components/ui/button'
import { Input } from './../../../../components/ui/input'
import { GitHubRepo, ProjectPartDeux } from './../../../../lib/data-model-types'
import { useAppContext } from './../../../../lib/hooks/app-context'
import DataSourceSelector from './data-source-selector'

const titleSchema = Joi.string()
  .pattern(/^[A-Za-z0-9](?:[A-Za-z0-9-_]*[A-Za-z0-9])?$/)
  .required()

const ProjectCreate = () => {
  const router = useRouter()
  const { activeBillingOrg } = useAppContext()

  const [controlledProjectDataSources, setControlledProjectDataSources] =
    useState<GitHubRepo[]>([])
  const [projectName, setProjectName] = useState<string>('')
  const [projectDescription, setProjectDescription] = useState<string>('')

  const [saveButtonEnabled, setSaveButtonEnabled] = useState<boolean>(true)

  // Force a user to select an active billing org first before they can create
  // a project
  if (!activeBillingOrg) {
    toast.error(`Please select billing organization`)
    router.push('/orgs')

    return null
  }

  return (
    <div className="flex-1 flex-col p-10">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="text-base my-1">
            <p>
              Create a project for which Sara will be focused on helping you
              understand it as well for adding to it through the process of
              creating goals and tasks. You will be able to communicate with
              Sara on each goal and task if you desire to drive them to
              completion.
            </p>
          </div>
          <div className="my-1">
            <h3 className="text-lg font-semibold">Set Project Name</h3>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <div className="my-1">
            <h3 className="text-lg font-semibold">Add Project Description</h3>
            <Input
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            />
          </div>
          <div className="my-1">
            <h3 className="text-lg font-semibold">
              Select Project Data Sources
            </h3>
            <DataSourceSelector
              orgName={activeBillingOrg.name}
              setControlledProjectDataSources={(gitHubRepos) =>
                setControlledProjectDataSources(gitHubRepos)
              }
            />
          </div>
        </div>
        <Button
          variant="ghost"
          className="bg-green-500 hover:bg-green-200"
          onClick={async (e) => {
            e.preventDefault()

            setSaveButtonEnabled(false)

            if (!projectName) {
              toast.error(`Please provide a project name`)
              setSaveButtonEnabled(true)
              return
            }

            if (titleSchema.validate(projectName).error) {
              toast.error(
                `Project name can only be alphanumerics, -, and _ with alphanumerics at the beginning and end`,
              )
              setSaveButtonEnabled(true)
              return
            }

            if (
              !controlledProjectDataSources ||
              controlledProjectDataSources.length === 0
            ) {
              toast.error(`Please select a primary data source`)
              setSaveButtonEnabled(true)
              return
            }

            try {
              const projectBody = {
                name: projectName,
                description: projectDescription,
                projectDataSources: controlledProjectDataSources,
              }

              const res = await fetch(
                `/api/orgs/${activeBillingOrg.id}/projects`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(projectBody),
                },
              )

              if (!res.ok) {
                const errText = await res.text()

                console.debug(`Failed to create a project because: ${errText}`)

                toast.error(`Failed to create project`)

                setSaveButtonEnabled(true)
                return
              }

              const project = (await res.json()) as ProjectPartDeux

              router.push(`/projects/${project.id}`)
            } catch (err) {
              console.debug(
                `Caught error when trying to create a billing organization: ${err}`,
              )

              setSaveButtonEnabled(true)

              toast.error(`Failed to create billing organization`)
            }
          }}
        >
          {saveButtonEnabled ? (
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
                d="m4.5 12.75 6 6 9-13.5"
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
          {saveButtonEnabled ? 'Save' : 'Saving'}
        </Button>
      </div>
    </div>
  )
}

export default ProjectCreate
