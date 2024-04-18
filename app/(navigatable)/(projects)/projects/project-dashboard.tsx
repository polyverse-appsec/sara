'use client'

import React from 'react'
import { Project } from 'lib/data-model-types'
import { Text } from '@radix-ui/themes'

import { ProjectCreateTile } from './project-create-tile'
import { ProjectDetailsTile } from './project-details-tile'
import { Skeleton } from '@radix-ui/themes'

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
      <div className="text-center mb-2">Projects</div>
      <div className="flex justify-center w-full">
        <div className="w-1/2 border-t-2 border-blue-600 mb-5"></div>
      </div>
      <div className="mb-10">
        <ProjectCreateTile />
      </div>  
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
