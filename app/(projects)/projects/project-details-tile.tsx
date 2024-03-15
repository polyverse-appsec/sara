'use client'

import React from 'react'
import Link from 'next/link'

interface ProjectTileProps {
  id: string
  name: string
  lastUpdatedAt: string
}

export const ProjectDetailsTile = ({
  id,
  lastUpdatedAt,
  name,
}: ProjectTileProps) => {
  // Convert the ISO string to a Date object
  const date = new Date(lastUpdatedAt);

  // Format the date to a more readable format
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }).format(date);

  return (
    <Link
      href={`/projects/${id}`}
      className="block transform transition hover:scale-105"
    >
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-gray-600">Created on: {formattedDate}</p>
      </div>
    </Link>
  )
}
