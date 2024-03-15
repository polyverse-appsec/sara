'use client'

import React from 'react'
import Link from 'next/link'

interface ProjectTileProps {
  id: string
  name: string
  createdAt: string
  lastUpdatedAt: string
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }).format(date)
} 

export const ProjectDetailsTile = ({
  id,
  createdAt,
  lastUpdatedAt,
  name,
}: ProjectTileProps) => {
  // Convert the ISO strings to a Date object
  const createdOnDate = new Date(createdAt);
  const lastedUpdatedDate = new Date(lastUpdatedAt);

  // Format the date to a more readable format
  const formattedCreateDate = formatDate(createdOnDate);
  const formattedLastUpdatedDate = formatDate(lastedUpdatedDate);

  return (
    <Link
      href={`/projects/${id}`}
      className="block transform transition hover:scale-105"
    >
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-gray-600">Created on: {formattedCreateDate}</p>
        <p className="text-sm text-gray-600">Last Updated: {formattedLastUpdatedDate}</p>
      </div>
    </Link>
  )
}
