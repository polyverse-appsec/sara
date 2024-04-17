'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextArea } from '@radix-ui/themes'
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

  useEffect(() => {
    ;(async () => {
      const project = await getResource<Project>(
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
          <Input
            value={name}
            placeholder="Enter Goal name"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="my-1">
          <h3 className="text-lg font-semibold">Description (Optional)</h3>
          <TextArea
            placeholder="Enter a description of your Goal that will guide Sara"
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
            placeholder="Enter an Acceptance Criteria that Sara will use to determine when the Goal is complete"
            onChange={(e) => setAcceptanceCriteria(e.target.value)}
          >
            {acceptanceCriteria}
          </TextArea>
        </div>
        <Button
          className="btn-blue hover:bg-blue-700 hover:text-white"
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
          }}
        >
          Create Goal
        </Button>
      </RenderableResourceContent>
    </RenderableResource>
  )
}

export default ProjectGoalCreate
