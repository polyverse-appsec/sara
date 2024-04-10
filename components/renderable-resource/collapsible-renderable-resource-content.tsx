'use client'

import React, { useState } from 'react'
import { ChevronDownIcon } from '@radix-ui/react-icons'

interface CollapsibleRenderableResourceContentProps {
  title: string
  children: React.ReactNode
}

const CollapsibleRenderableResourceContent = ({
  title,
  children,
}: CollapsibleRenderableResourceContentProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdown = () => setIsOpen(!isOpen)

  return (
    <div className="bg-background shadow-md rounded-lg p-6 border mb-4">
      {/* Title section that can be clicked to toggle the dropdown */}
      <div
        className="flex cursor-pointer items-center justify-between w-full"
        onClick={toggleDropdown}
      >
        <span className="text-center flex-1 font-bold">{title}</span>
        <ChevronDownIcon className="shrink-0" />
      </div>

      {/* Conditional rendering of children based on `isOpen` state */}
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  )
}

export default CollapsibleRenderableResourceContent
