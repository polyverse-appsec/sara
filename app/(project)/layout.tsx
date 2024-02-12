'use client'

import React from 'react'

import SidebarNav from './../../components/prototypes/sidebar-nav'
import MiniDashboard from './../../components/prototypes/mini-dashboard'

// Define project data for demo purposes
const projectData = [
    { id: 1, name: 'Project One', date: '2023-04-01', status: 'active'},
    { id: 2, name: 'Project Two', date: '2023-04-01', status: 'active'},
    { id: 3, name: 'Project Three', date: '2023-04-01', status: 'active'},
    { id: 4, name: 'Project Four', date: '2023-04-01', status: 'active'},
    { id: 5, name: 'Project Five', date: '2023-04-01', status: 'active'},
    { id: 6, name: 'Project Six', date: '2023-04-01', status: 'active'},
    // Add more project objects here ...
  ]

// Define the RootLayout component that encapsulates the page structure
const ProjectLayout = () => {

  return (
    <>
        <div className="flex h-screen bg-gray-200">
            <SidebarNav />
            <div className="flex-1 p-10 text-2xl font-bold">
                <MiniDashboard projects={projectData} />
            </div>
        </div>
    </>
  )
}

export default ProjectLayout