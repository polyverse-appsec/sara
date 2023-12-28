'use client'

import React, { useState } from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@radix-ui/react-collapsible';
import { Button } from '@/components/ui/button'; // Adjust import as needed
import {GithubSelect} from '@/components/github-select'; // Adjust import as needed, using default import
import { type Session } from 'next-auth'

export interface GithubPanelProps {
  session: Session;
}
export function GithubPanel ({session }: GithubPanelProps) {

  if (!session?.user){
    return null;
  }

  return (
    <GithubSelect session={session} />
  );

  /*
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="your-trigger-class">Select Options</CollapsibleTrigger>
      <CollapsibleContent className="your-content-class">
        <div className="flex space-x-4">
          <GitHubSelect label="Select Organization" options={[{ value: 'org1', label: 'Organization 1' }]} />
          <GitHubSelect label="Select Repository" options={[{ value: 'repo1', label: 'Repository 1' }]} />
          {open && (
            <Button onClick={() => {}}>
              Add Reference GitHub Repository
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
  */
};

