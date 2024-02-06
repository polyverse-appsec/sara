// footer.tsx
import React from 'react';
import { SaraStatus } from './sara-status'; // Ensure this is correctly imported
import { ThemeToggle } from './theme-toggle'; // Ensure this is correctly imported

export const Footer = () => {
  return (
    <footer className="sticky bottom-0 z-50 w-full px-4 py-2 border-t bg-gradient-to-t from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <ThemeToggle /> {/* Theme toggle on the left */}
        </div>
        <div className="flex-1 flex justify-center">
          <SaraStatus /> {/* SaraStatus centered */}
        </div>
        <div className="flex-1"> {/* Placeholder to balance the layout */}</div>
      </div>
    </footer>
  );
};

