// footer.tsx
import React from 'react'

import { CraftedBy } from './crafted-by' // Ensure this is correctly imported
import { SaraStatus } from './sara-status' // Ensure this is correctly imported
import { ThemeToggle } from './theme-toggle' // Ensure this is correctly imported

export const Footer = () => {
  return (
    <footer className="sticky bottom-0 z-50 w-full px-4 py-2 border-t bg-gradient-to-t from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-start flex-1">
          <ThemeToggle /> {/* Theme toggle on the left, left-justified */}
        </div>
        <div className="flex justify-center flex-1">
          <SaraStatus /> {/* SaraStatus centered in the middle */}
        </div>
        <div className="flex justify-end flex-1">
          <CraftedBy /> {/* CraftedBy on the right, right-justified */}
        </div>
      </div>
    </footer>
  )
}
