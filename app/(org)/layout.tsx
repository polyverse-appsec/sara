'use client'

import React from 'react'

import ProjectDashboard from '../../components/prototypes/project-dashboard'
import SidebarNav from './../../components/prototypes/sidebar-nav'

interface OrgLayoutProps {
  children: React.ReactNode
}

// Define the RootLayout component that encapsulates the page structure
const OrgLayout = ({ children }: OrgLayoutProps) => {
  return (
    <>
      <div className="flex h-screen bg-gray-200">
        <SidebarNav />
        {children}
      </div>
    </>
  )
}

export default OrgLayout
