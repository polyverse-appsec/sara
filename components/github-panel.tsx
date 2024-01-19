'use client'

import React, { useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@radix-ui/react-collapsible'

import { Button } from '@/components/ui/button' // Adjust import as needed
import { GithubSelect } from '@/components/github-select' // Adjust import as needed, using default import

export function GithubPanel() {
  return <GithubSelect />
}
