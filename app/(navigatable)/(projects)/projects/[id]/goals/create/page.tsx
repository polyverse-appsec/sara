'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Joi from 'joi'
import { type Goal, type Project } from 'lib/data-model-types'
import toast from 'react-hot-toast'

import {
  createResource,
  getResource,
} from './../../../../../../../app/saraClient'
import RenderableResource from './../../../../../../../components/renderable-resource/renderable-resource'
import RenderableResourceContent from './../../../../../../../components/renderable-resource/renderable-resource-content'
import { Button } from './../../../../../../../components/ui/button'
import { Input } from './../../../../../../../components/ui/input'

const ProjectGoalCreate = ({ params: { id } }: { params: { id: string } }) => {
  const router = useRouter()

  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string>('')
  const [project, setProject] = useState<Project | null>(null)
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false)
  const [displayRequiredText, setDisplayRequiredText] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const project = await getResource<Project>(
          `/projects/${id}`,
          'Failed to load project details',
        )

        setProject(project)
      } catch (error) {
        console.error(`Failed to load project ${id} details because: ${error}`)
      }
    })()
  }, [id, project])

  if (!project) {
    return null
  }

  // Validation schema using Joi
  const schema = Joi.object({
    name: Joi.string().trim().required(),
    description: Joi.string().trim().allow(''),
    acceptanceCriteria: Joi.string().trim().allow(''),
  })

  // Validate input data
  const validate = () => {
    const { error } = schema.validate(
      { name, description, acceptanceCriteria },
      { abortEarly: false },
    )
    if (error) {
      error.details.forEach((detail) => {
        toast.error(detail.message)
      })
      return false
    }
    return true
  }

  // Handle button click
  const handleCreateGoal = async () => {
    if (validate()) {
      setIsButtonDisabled(true)

      try {
        const goalBody = {
          orgId: project.orgId,
          parentProjectId: project.id,
          name,
          description,
          acceptanceCriteria,
        }

        const goal = await createResource<Goal>(
          `/goals`,
          goalBody,
          'Failed to create goal',
        )

        router.push(`/goals/${goal.id}`)
      } catch (error) {
        toast.error(`Failed to create Goal because: ${error}`)
      } finally {
        setIsButtonDisabled(false)
      }
    }
  }

  return (
    <RenderableResource>
      <RenderableResourceContent>
        <div className="text-base my-1">
          <p>
            Create a new high-level Goal for your Software Project that Sara
            will help you complete.
          </p>
          <p>
            Providing a detailed description and Acceptance Criteria will help
            improve the quality of Sara&apos;s guidance.
          </p>
        </div>
        <div className="my-1">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold">Goal Name</h3>
            {displayRequiredText && !name && (
              <span className="ml-2 text-sm text-red-500">Required</span>
            )}
          </div>
          <Input
            value={name}
            placeholder="Enter Goal name"
            onChange={(e) => setName(e.target.value)}
            disabled={isButtonDisabled}
          />
        </div>

        <div className="my-1">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold">Description</h3>
            <p className="text-sm ml-2">(optional)</p>
          </div>
          <Input
            value={description}
            placeholder="Enter a description of your Goal that will guide Sara"
            onChange={(e) => setDescription(e.target.value)}
            disabled={isButtonDisabled}
            className="grow"
          />
        </div>

        <div className="my-1">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold">Acceptance Criteria</h3>
            <p className="text-sm ml-2">(optional)</p>
          </div>
          <Input
            value={acceptanceCriteria}
            placeholder="Enter an Acceptance Criteria that Sara will use to determine when the Goal is complete"
            onChange={(e) => setAcceptanceCriteria(e.target.value)}
            disabled={isButtonDisabled}
            className="grow"
          />
        </div>

        <div className="flex justify-between">
          <Button
            variant="ghost"
            className={`${
              isButtonDisabled || !name
                ? 'bg-gray-500 hover:cursor-not-allowed'
                : 'btn-blue hover:bg-blue-700 hover:text-white'
            } transition duration-300`}
            onClick={async (e) => {
              e.preventDefault()

              setIsButtonDisabled(true)

              if (!name) {
                setDisplayRequiredText(true)
                toast.error(`Please provide a Goal name`)
                setIsButtonDisabled(false)
                return
              }

              handleCreateGoal()

              setIsButtonDisabled(false)
            }}
            disabled={isButtonDisabled}
          >
            {!isButtonDisabled ? null : (
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
            Create Goal
          </Button>
        </div>
      </RenderableResourceContent>
    </RenderableResource>
  )
}

export default ProjectGoalCreate
