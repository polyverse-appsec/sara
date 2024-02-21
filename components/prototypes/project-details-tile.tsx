'use client'

import React from 'react'
import Link from 'next/link'

interface ProjectTileProps {
  id: string
  name: string
  lastUpdatedAt: Date
}

export const ProjectDetailsTile = ({
  id,
  lastUpdatedAt,
  name,
}: ProjectTileProps) => {
  return (
    <Link
      href={`/projects/${id}`}
      className="block transform transition hover:scale-105"
    >
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-gray-600">{lastUpdatedAt.toDateString()}</p>
      </div>
    </Link>
  )
}
