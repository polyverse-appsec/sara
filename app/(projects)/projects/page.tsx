'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectPartDeux } from 'lib/data-model-types'
import toast from 'react-hot-toast'

import { useAppContext } from './../../../lib/hooks/app-context'
import ProjectDashboard from './project-dashboard'

const ProjectIndex = () => {
  const router = useRouter()
  const { activeBillingOrg, setProjectIdForConfiguration } = useAppContext()

  const [projects, setProjects] = useState<ProjectPartDeux[]>([])

  useEffect(() => {
    ;(async () => {
      // Only fetch if we have an active billing org
      if (!activeBillingOrg) {
        return
      }

      setProjectIdForConfiguration(null)

      const res = await fetch(`/api/orgs/${activeBillingOrg.id}/projects`)

      if (!res.ok) {
        const errText = await res.text()

        throw new Error(
          `Failed to get a success response when fetching projects because: ${errText}`,
        )
      }

      const fetchedProjects = await res.json()

      setProjects(fetchedProjects)
    })()
  }, [])

  // Force a user to select an active billing org first before getting to their
  // projects
  if (!activeBillingOrg) {
    toast.error(`Please select billing organization`)
    router.push('/orgs')

    return null
  }

  return (
    <div className="flex-1 p-10 text-2xl font-bold">
      <ProjectDashboard projects={projects} />
    </div>
  )
}

export default ProjectIndex
