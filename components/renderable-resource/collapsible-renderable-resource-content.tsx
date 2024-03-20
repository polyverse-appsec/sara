'use client'

import React, { useState } from 'react';
import { ChevronDownIcon } from '@radix-ui/react-icons';

interface CollapsibleRenderableResourceContentProps {
  title: string;
  children: React.ReactNode;
}

const CollapsibleRenderableResourceContent = ({
  title,
  children,
}: CollapsibleRenderableResourceContentProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div className="bg-background shadow-md rounded-lg p-6 border mb-4">
      {/* Title section that can be clicked to toggle the dropdown */}
      <div
        className="flex cursor-pointer justify-between"
        onClick={toggleDropdown}
      >
        {title}
        <ChevronDownIcon />
      </div>

      {/* Conditional rendering of children based on `isOpen` state */}
      {isOpen && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default CollapsibleRenderableResourceContent;