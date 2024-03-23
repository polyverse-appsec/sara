'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { renderHealthIcon } from 'app/react-utils'
import ProjectStatusCard from 'components/project-status/project-status-card'
import { ProjectHealth, ProjectHealthStatusValue } from 'lib/data-model-types'

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
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export const ProjectDetailsTile = ({
  id,
  createdAt,
  lastUpdatedAt,
  name,
}: ProjectTileProps) => {
  // Convert the ISO strings to a Date object
  const createdOnDate = new Date(createdAt)
  const lastedUpdatedDate = new Date(lastUpdatedAt)

  // Format the date to a more readable format
  const formattedCreateDate = formatDate(createdOnDate)
  const formattedLastUpdatedDate = formatDate(lastedUpdatedDate)

  const [projectHealth, setProjectHealth] = useState<ProjectHealth>()

  useEffect(() => {
    const fetchProjectHealth = async () => {
      const healthRes = await fetch(`/api/projects/${id}/health`)

      if (healthRes.ok) {
        const fetchedHealth = (await healthRes.json()) as ProjectHealth
        setProjectHealth(fetchedHealth)
      } else {
        console.debug(`Failed to get project health`)
      }
    }

    fetchProjectHealth()
  }, [])

  return (
    <Link
      href={`/projects/${id}`}
      className="block transform transition hover:scale-105"
    >
      <div className="flex justify-between bg-background shadow-md rounded-lg p-6">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-gray-600">
            Created on: {formattedCreateDate}
          </p>
          <p className="text-sm text-gray-600">
            Last Updated: {formattedLastUpdatedDate}
          </p>
        </div>
        {projectHealth && (
          <div className="my-1">
            <div className="flex items-center">
              <ProjectStatusCard
                health={projectHealth}
                lastRefreshedAt={lastedUpdatedDate}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
