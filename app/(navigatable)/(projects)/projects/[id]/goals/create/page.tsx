'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextArea } from '@radix-ui/themes'
import Joi from 'joi'
import { type GoalPartDeux, type ProjectPartDeux } from 'lib/data-model-types'
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

  const [project, setProject] = useState<ProjectPartDeux | null>(null)

  useEffect(() => {
    ;(async () => {
      const project = await getResource<ProjectPartDeux>(
        `/projects/${id}`,
        'Failed to load project details',
      )

      setProject(project)
    })()
  }, [id])

  return (
    <RenderableResource>
      <RenderableResourceContent>
        <div className="text-base my-1">
          <p>
            Create a new high-level goal for your Software Project that Sara
            will help you complete. The more detailed your description and the
            more thorough the acceptance criteria the more Sara will be able to
            do for you and improve her accuracy.
          </p>
        </div>
        <div className="my-1">
          <h3 className="text-lg font-semibold">Name</h3>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="my-1">
          <h3 className="text-lg font-semibold">Description</h3>
          <TextArea
            placeholder="Description for goal..."
            onChange={(e) => setDescription(e.target.value)}
          >
            {description}
          </TextArea>
        </div>
        <div className="my-1">
          <h3 className="text-lg font-semibold">
            Acceptance Criteria (Optional)
          </h3>
          <TextArea
            placeholder="Acceptance criteria for goal..."
            onChange={(e) => setAcceptanceCriteria(e.target.value)}
          >
            {acceptanceCriteria}
          </TextArea>
        </div>
        <Button
          className="bg-green-500"
          onClick={async (e) => {
            e.preventDefault()

            if (!project) {
              toast.error('Project details not loaded')
              return
            }

            if (Joi.string().required().validate(name).error) {
              toast.error('Name required')
              return
            }

            if (Joi.string().required().validate(description).error) {
              toast.error('Description required')
              return
            }

            const goalBody = {
              orgId: project.orgId,
              parentProjectId: project.id,
              name,
              description,
              acceptanceCriteria,
            }

            const goal = await createResource<GoalPartDeux>(
              `/goals`,
              goalBody,
              'Failed to create goal',
            )

            router.push(`/goals/${goal.id}`)
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z"
              fill="currentColor"
              fill-rule="evenodd"
              clip-rule="evenodd"
            />
          </svg>
          Create Goal
        </Button>
      </RenderableResourceContent>
    </RenderableResource>
  )
}

export default ProjectGoalCreate
