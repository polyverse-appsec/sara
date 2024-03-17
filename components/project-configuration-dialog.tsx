'use client'

import { useState } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'
import * as ScrollArea from '@radix-ui/react-scroll-area'

import { Repository } from './../lib/data-model-types'
import { type ProjectConfigurable } from './../lib/hooks/app-context'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

export type ProjectDataReferenceState = {
  checked: boolean
  repo: Repository
}

export type ProjectConfigurationDialogProps = {
  projectDataReferences: Repository[]
  open: boolean
  onOpenChange: (open: boolean) => void
  // TODO: Just added null for now to allow this without TypeScript errors as I think this logic of saving is out of scope for now
  onSaveConfig: (config: ProjectConfigurable | null) => void
}

const createProjectDataReferenceState = (repos: Repository[]) => {
  return repos.reduce(
    (accumulator, repo) => {
      accumulator[repo.id] = {
        checked: false,
        repo,
      }

      return accumulator
    },
    {} as Record<string, ProjectDataReferenceState>,
  )
}

// TODO: Do I need to have onSaveConfig right now? Just want to pass in list of repos that could be added
export const ProjectConfigurationDialog = ({
  projectDataReferences,
  open,
  onOpenChange,
  onSaveConfig,
}: ProjectConfigurationDialogProps) => {
  const [projectDataReferenceState, setProjectDataReferenceState] = useState(
    createProjectDataReferenceState(projectDataReferences),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Project References</DialogTitle>
          <DialogDescription>
            Add additional references to your project for learning and
            fine-tuning your model.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 space-y-1 text-sm border rounded-md">
          <div className="font-medium">Select Project References</div>
          <div className="text-muted-foreground">
            <ScrollArea.Root>
              <ScrollArea.Viewport className="max-h-80">
                <div style={{ padding: '15px 20px' }}>
                  {Object.entries(projectDataReferenceState).map(
                    ([key, projectDataReference]) => (
                      <div
                        className="py-1"
                        style={{ display: 'flex', alignItems: 'center' }}
                        key={key}
                      >
                        <Checkbox.Root
                          className="flex items-center justify-center w-5 h-5 bg-background border border-gray-600 rounded-md shadow opacity-95 focus:opacity-100"
                          id={key}
                          checked={projectDataReference.checked}
                          onCheckedChange={(checked) => {
                            const newProjectDataReferenceState = {
                              ...projectDataReferenceState,
                            }

                            if (checked !== 'indeterminate') {
                              newProjectDataReferenceState[key].checked =
                                checked
                            }

                            setProjectDataReferenceState(
                              newProjectDataReferenceState,
                            )
                          }}
                        >
                          <Checkbox.Indicator>
                            <CheckIcon />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                        <label className="pl-2" htmlFor={key}>
                          {projectDataReference.repo.name}
                        </label>
                      </div>
                    ),
                  )}
                </div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar orientation="vertical">
                <ScrollArea.Thumb />
              </ScrollArea.Scrollbar>
              <ScrollArea.Corner />
            </ScrollArea.Root>
          </div>
        </div>
        <DialogFooter className="items-center">
          <Button variant="ghost" onClick={() => onSaveConfig(null)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
