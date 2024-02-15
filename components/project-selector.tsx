'use client'

import React, { useEffect, useState } from 'react'
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
}

export const ProjectSelector = ({ user, org }: ProjectSelectorProps) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

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
  }, [])

  console.log(`***** <ProjectSelector>`)

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
              onSelect={(event) => setSelectedProject(project)}
            >
              <span className="ml-2">{project.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
