'use client'

import React, { useEffect, useState } from 'react'

import { type ProjectPartDeux } from './../../../../lib/data-model-types'

const PageIndex = ({ params: { id } }: { params: { id: string } }) => {
  const [project, setProject] = useState<ProjectPartDeux | null>(null)

  useEffect(() => {
    ;(async () => {
      const res = await fetch(`/api/projects/${id}`)

      if (!res.ok) {
        const errText = await res.text()

        throw new Error(
          `Failed to get a success response when fetching project '${id}' because: ${errText}`,
        )
      }

      const fetchedProject = await res.json()

      setProject(fetchedProject)
    })()
  }, [])

  if (!project) {
    return null
  }

  return (
    <div className="flex-1 flex-col gap-4 p-10 text-2xl font-bold">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold">{project.name}</h3>
      </div>
    </div>
  )
}

export default PageIndex
