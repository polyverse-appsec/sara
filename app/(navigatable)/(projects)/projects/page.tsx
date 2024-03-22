'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectPartDeux } from 'lib/data-model-types'
import toast from 'react-hot-toast'

import { useAppContext } from './../../../../lib/hooks/app-context'
import getOrgProjects from './../../../rest-requests/get-org-projects'
import ProjectDashboard from './project-dashboard'

const ProjectIndex = () => {
  const router = useRouter()
  const {
    activeBillingOrg,
    setActiveBillingOrg,
    setProjectIdForConfiguration,
  } = useAppContext()

  const [projects, setProjects] = useState<ProjectPartDeux[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      // if we hit this page directly, without going through the billing org set logic, we'll need
      //     to load it again
      setProjectIdForConfiguration(null)

      if (!activeBillingOrg) {
        const orgRes = await fetch('/api/orgs/active')

        if (orgRes.ok) {
          const defaultOrg = await orgRes.json()
          setActiveBillingOrg(defaultOrg)

          if (defaultOrg && defaultOrg.id) {
            fetchProjects(defaultOrg.id)
          }
        } else {
          toast.error(`Please select a billing organization`)
          router.push('/orgs')
          return
        }
      } else {
        fetchProjects(activeBillingOrg.id)
      }
    })()
  }, [
    activeBillingOrg,
    setActiveBillingOrg,
    setProjectIdForConfiguration,
    router,
  ])

  const fetchProjects = async (orgId: string) => {
    setIsLoading(true)
    const res = await fetch(`/api/orgs/${orgId}/projects`)

    if (!res.ok) {
      const errText = await res.text()
      toast.error(`Failed to fetch projects: ${errText}`)
      setIsLoading(false)
      return
    }

    const fetchedProjects = await res.json()
    setProjects(fetchedProjects)
    setIsLoading(false)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex-1 p-10 text-2xl font-bold">
      <ProjectDashboard projects={projects} />
    </div>
  )
}

export default ProjectIndex
