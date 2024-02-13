'use client'

import React from 'react'
import Link from 'next/link'

// @ts-ignore
const MiniDashboard = ({ projects }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {
        // @ts-ignore
        projects.map((project, index) => (
          <Link
            href={`/projects/${project.id}`}
            key={index}
            className="block transform transition hover:scale-105"
          >
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold">{project.name}</h3>
              <p className="text-sm text-gray-600">{project.date}</p>
              <p
                className={`text-sm ${
                  project.status === 'active'
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                {project.status}
              </p>
            </div>
          </Link>
        ))
      }
    </div>
  )
}

export default MiniDashboard
