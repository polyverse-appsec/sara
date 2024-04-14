'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Project } from 'lib/data-model-types'
import toast from 'react-hot-toast'

import { getResource } from './../../../../app/saraClient'
import { useAppContext } from './../../../../lib/hooks/app-context'
import ProjectDashboard from './project-dashboard'
import SaraLoading from 'components/sara-loading'

const ProjectIndex = () => {
  const router = useRouter()
  const {
    activeBillingOrg,
    activeProjectDetails,
    setProjectIdForConfiguration,
  } = useAppContext()

  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setIsLoading(true)

      if (!activeBillingOrg) {
        toast.error(`Please select a billing context`)
        router.push('/orgs')

        return
      }

      const projects = await getResource<Project[]>(
        `/orgs/${activeBillingOrg.id}/projects`,
      )

      setProjects(projects)
      setIsLoading(false)
    })()
  }, [activeBillingOrg, router])

  // Make sure to clear the active project to ensure we don't render the nav
  // bar specific details to a previously selected project.
  if (activeProjectDetails && activeProjectDetails.id) {
    setProjectIdForConfiguration(null)
  }

  if (isLoading) {
    return <SaraLoading message="Sara is refreshing your projects..." />
  }

  return (
    <div className="flex-1 p-10 text-2xl font-bold">
      <ProjectDashboard
        projects={projects}
        onProjectDelete={(deletedProjectId) => {
          const filteredProjects = projects.filter(
            (project) => project.id !== deletedProjectId,
          )

          setProjects(filteredProjects)
        }}
      />
    </div>
  )
}

export default ProjectIndex
