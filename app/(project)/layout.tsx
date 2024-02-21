'use client'

import React from 'react'

import ProjectDashboard from '../../components/prototypes/project-dashboard'
import SidebarNav from './../../components/prototypes/sidebar-nav'

// Define the RootLayout component that encapsulates the page structure
const ProjectLayout = () => {
  return (
    <>
      <div className="flex h-screen bg-gray-200">
        <SidebarNav />
        <div className="flex-1 p-10 text-2xl font-bold">
          <ProjectDashboard />
        </div>
      </div>
    </>
  )
}

export default ProjectLayout
