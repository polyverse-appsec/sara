'use client'

import React from 'react'
import { Skeleton, Text, Flex, Button, Link } from '@radix-ui/themes'
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
        <Flex align="center" justify="end" className="w-full">
            <Button
                className="btn-blue hover:bg-blue-700 hover:text-foreground transition duration-300"
            >
                <Link href={`/projects/create`}>
                    New Project
                </Link>
            </Button>
        </Flex>
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
