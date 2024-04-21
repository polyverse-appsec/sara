'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SaraLoading from 'components/sara-loading'
import { Project } from 'lib/data-model-types'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

import { getResource } from './../../../../app/saraClient'
import { type SaraSession } from './../../../../auth'
import { useAppContext } from './../../../../lib/hooks/app-context'
import ProjectDashboard from './project-dashboard'

const ProjectIndex = () => {
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const router = useRouter()
  const {
    activeBillingOrg,
    activeProjectDetails,
    setProjectIdForConfiguration,
  } = useAppContext()

  const [projects, setProjects] = useState<Project[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (saraSession && activeBillingOrg) {
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }
  }, [saraSession, activeBillingOrg])

  useEffect(() => {
    if (!activeBillingOrg) {
      return
    }

    // Since we're in this effect, we know activeBillingOrg must exist
    ;(async () => {
      try {
        const projects = await getResource<Project[]>(
          `/orgs/${activeBillingOrg.id}/projects`,
        )
        setProjects(projects)
      } catch (error: any) {
        toast.error(`Failed to load projects: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [activeBillingOrg, router])

  useEffect(() => {
    if (activeProjectDetails?.id) {
      setProjectIdForConfiguration(null)
    }
  }, [activeProjectDetails, setProjectIdForConfiguration])

  // This use effect is to just refresh the project details...
  useEffect(() => {
    let isMounted = true

    if (!saraSession || !activeBillingOrg) {
      return
    }

    if (!projects || projects.length === 0) {
      return
    }

    const fetchProjectHealthFrequencyMilliseconds = 5 * 60 * 1000

    const fetchHealthOfAllProjects = async () => {
      try {
        for (const project of projects) {
            const healthRes = await fetch(`/api/projects/${project.id}/health`)

          if (!healthRes.ok) {
            console.debug(`${saraSession.email} Failed to get project health for project ${project.id}`)
          }
        }

        if (isMounted) {

          setTimeout(
            fetchHealthOfAllProjects,
            fetchProjectHealthFrequencyMilliseconds,
          )
        }
      } catch (err) {
        console.debug(`Failed to fetch project details because: ${err}`)

        if (isMounted) {
          setTimeout(
            fetchHealthOfAllProjects,
            fetchProjectHealthFrequencyMilliseconds,
          )
        }
      }
    }

    fetchHealthOfAllProjects()

    return () => {
      isMounted = false
    }
  }, [activeBillingOrg, saraSession, projects])

  if (isLoading || !activeBillingOrg || !saraSession) {
    return <SaraLoading message="Sara is refreshing your projects..." />
  }

  return (
    <div className="flex-1 p-5 text-2xl font-bold">
      <div className="bg-background shadow-md rounded-lg border border-blue-500 p-5 block transition" style={{ height: 'calc(100% - 2rem)' }}>
        <ProjectDashboard
          projects={projects}
          onProjectDelete={(deletedProjectId: any) => {
            if (!projects) {
                return
            }
            setProjects(
                projects.filter((project) => project.id !== deletedProjectId),
            )
          }}
        />
      </div>
    </div>
  )
}

export default ProjectIndex
