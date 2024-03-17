'use client'

import React from 'react'

import SidebarNav from './../../components/sidebar-nav'

interface ProjectLayoutProps {
  children: React.ReactNode
}

// Define the RootLayout component that encapsulates the page structure
const ProjectLayout = ({ children }: ProjectLayoutProps) => {
  return (
    <>
      <div className="flex h-screenb bg-background">
        <SidebarNav />
        {children}
      </div>
    </>
  )
}

export default ProjectLayout
