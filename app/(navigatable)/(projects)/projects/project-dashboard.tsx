'use client'

import React from 'react'
import { Skeleton, Text } from '@radix-ui/themes'
import RenderableResourceContent from 'components/renderable-resource/renderable-resource-content'
import { Project } from 'lib/data-model-types'

import { ProjectCreateTile } from './project-create-tile'
import { ProjectDetailsTile } from './project-details-tile'

interface ProjectDashboardProps {
  projects: Project[] | undefined
  onProjectDelete: (projectId: string) => void
}

const ProjectDashboard = ({
  projects,
  onProjectDelete,
}: ProjectDashboardProps) => {
  return (
    <div>
      <RenderableResourceContent>
        <div className="text-center mb-2">Projects</div>
      </RenderableResourceContent>
      <Skeleton loading={projects === undefined}>
        {projects !== undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(({ id, name, createdAt, lastUpdatedAt }) => (
              <ProjectDetailsTile
                key={id}
                id={id}
                name={name}
                createdAt={
                  typeof createdAt === 'string'
                    ? createdAt
                    : createdAt.toDateString()
                }
                lastUpdatedAt={
                  typeof lastUpdatedAt === 'string'
                    ? lastUpdatedAt
                    : lastUpdatedAt.toDateString()
                }
                onProjectDelete={onProjectDelete}
              />
            ))}
            <div className="flex items-center justify-center">
              <div className="w-1/2 flex items-center">
                <ProjectCreateTile />
              </div>
            </div>
          </div>
        ) : (
          // projects is undefined, so we haven't finished loading projects yet - just say loading
          <div className="text-center">
            <Text size="2" className="italic text-gray-500">
              Loading...
            </Text>
          </div>
        )}
      </Skeleton>
    </div>
  )
}

export default ProjectDashboard
