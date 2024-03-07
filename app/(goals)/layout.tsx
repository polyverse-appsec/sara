'use client'

import React from 'react'

import SidebarNav from './../../components/prototypes/sidebar-nav'

interface GoalLayoutProps {
  children: React.ReactNode
}

// Define the RootLayout component that encapsulates the page structure
const GoalLayout = ({ children }: GoalLayoutProps) => {
  return (
    <>
      <div className="flex h-screen bg-gray-200">
        <SidebarNav />
        {children}
      </div>
    </>
  )
}

export default GoalLayout