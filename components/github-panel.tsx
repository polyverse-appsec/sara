'use client'

import React, { useState } from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@radix-ui/react-collapsible';
import { Button } from '@/components/ui/button'; // Adjust import as needed
import GitHubSelect from '@/components/github-select'; // Adjust import as needed, using default import

interface GithubPanelProps {
  isLoggedIn: boolean;
}

const GithubPanel: React.FC<GithubPanelProps> = ({ isLoggedIn }) => {
  const [open, setOpen] = useState(false);

  if (!isLoggedIn) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="your-trigger-class">Select Options</CollapsibleTrigger>
      <CollapsibleContent className="your-content-class">
        <div className="flex space-x-4">
          <GitHubSelect label="Select Organization" options={[{ value: 'org1', label: 'Organization 1' }]} />
          <GitHubSelect label="Select Repository" options={[{ value: 'repo1', label: 'Repository 1' }]} />
          {open && (
            <Button onClick={() => {/* your add reference method */}}>
              Add Reference GitHub Repository
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default GithubPanel;
