'use client'

import React from 'react'

import SidebarNav from './../../components/sidebar-nav'

interface ProjectLayoutProps {
  children: React.ReactNode
}

// Define the RootLayout component that encapsulates the page structure
//TODO: need to handle mobile
const ProjectLayout = ({ children }: ProjectLayoutProps) => {
  return (
    <>
      <div className="w-[250px] fixed h-full overflow-y-auto">
        <SidebarNav />
      </div>
      <div className="flex-1 ml-[250px] overflow-auto">{children}</div>
    </>
  )
}

export default ProjectLayout
