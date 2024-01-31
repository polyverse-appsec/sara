'use client'

import React, { useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@radix-ui/react-collapsible'

import { GithubSelect } from './github-select' // Adjust import as needed, using default import
import { Button } from './ui/button' // Adjust import as needed

export function GithubPanel() {
  return <GithubSelect />
}
