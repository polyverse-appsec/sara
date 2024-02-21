'use client'

import React from 'react'

interface ProjectCreateTileProps {
  onClick: () => void
}

export const ProjectCreateTile = ({ onClick }: ProjectCreateTileProps) => {
  // TODO: Don't think I actually want a link here do I? I want something that I can click on for sure but don't want to route
  return (
    <div
      onClick={onClick}
      className="bg-white shadow-md rounded-lg p-6 block transform transition hover:scale-105"
    >
      <h3 className="text-lg font-semibold text-center">Create New Project</h3>
      <div className="flex justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </div>
    </div>
  )
}
