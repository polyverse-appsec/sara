'use client'

import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import { useAppContext } from './../../../lib/hooks/app-context'
import ProjectDashboard from './project-dashboard'

const ProjectIndex = () => {
  const router = useRouter()
  const { activeBillingOrg } = useAppContext()

  // Force a user to select an active billing org first before getting to their
  // projects
  if (!activeBillingOrg) {
    toast.error(`Please select billing organization`)
    router.push('/orgs')

    return null
  }

  return (
    <div className="flex-1 p-10 text-2xl font-bold">
      <ProjectDashboard />
    </div>
  )
}

export default ProjectIndex
