'use client'

import React, { useEffect, useState } from 'react'
import { deleteProject } from 'app/_actions/delete-project'
import { getProjects } from 'app/_actions/get-projects'
import toast from 'react-hot-toast'

import {
  type Organization,
  type Project,
  type User,
} from './../lib/data-model-types'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface ProjectSelectorProps {
  user: User
  org: Organization

  initialProject: Project | null
  onProjectChanged: (project: Project) => void
}

// TODO: Work items to make functional
// * Handle project changes so that we update our app context - should be function handler passed in

export const ProjectSelector = ({
  user,
  org,
  initialProject = null,
  onProjectChanged,
}: ProjectSelectorProps) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(
    initialProject,
  )

  const setProjectsState = async () => {
    try {
      const projects = await getProjects(org.login, user)

      setProjects(projects)
    } catch (err) {
      console.debug(
        `<ProjectSelector> Unable to fetch and set projects - error ${err}`,
      )

      toast.error(
        'Unable to fetch user projects - please switch organizations and back',
      )
    }
  }

  useEffect(() => {
    setProjectsState()
  }, [org.login, user])

  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="pl-0">
            {selectedProject ? (
              <span className="ml-2">{selectedProject.name}</span>
            ) : (
              <span className="ml-2">Select Project</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start" className="w-[180px]">
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.name}
              onSelect={(event) => {
                setSelectedProject(project)
                onProjectChanged(project)
              }}
            >
              <span className="ml-2">{project.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
