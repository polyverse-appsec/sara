'use client'

import React from 'react'

import SidebarNav from './../../components/sidebar-nav'

interface GoalLayoutProps {
  children: React.ReactNode
}

// Define the RootLayout component that encapsulates the page structure
const GoalLayout = ({ children }: GoalLayoutProps) => {
  return (
    <>
      <div className="flex h-screen bg-background">
        <SidebarNav />
        {children}
      </div>
    </>
  )
}

export default GoalLayout
