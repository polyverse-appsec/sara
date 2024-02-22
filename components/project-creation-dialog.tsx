'use client'

import React, { useEffect, useState } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import Joi from 'joi'
import { Assistant } from 'openai/resources/beta/assistants/assistants'
import toast from 'react-hot-toast'

import { createProject } from '../app/_actions/create-project'
import {
  type Organization,
  type Project,
  type Repository,
  type User,
} from './../lib/data-model-types'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Input } from './ui/input'
import { Label } from './ui/label'

const titleSchema = Joi.string()
  .pattern(/^[A-Za-z0-9](?:[A-Za-z0-9-_]*[A-Za-z0-9])?$/)
  .required()

// TODO: For completion
// * Have a onSaveHanlder in place for creating the project
// * Read the data as if a form: https://react.dev/reference/react-dom/components/input#reading-the-input-values-when-submitting-a-form

interface SecondaryDataSource {
  checked: boolean
  repo: Repository
}

const createInitialSecondaryDataSources = (repos: Repository[]) => {
  return repos.reduce(
    (accumulator, repo) => {
      accumulator[repo.id] = {
        checked: false,
        repo,
      }

      return accumulator
    },
    {} as Record<string, SecondaryDataSource>,
  )
}

const renderSecondaryDataSources = (
  secondaryDataSources: Record<string, SecondaryDataSource>,
  setSecondaryDataSources: React.Dispatch<
    React.SetStateAction<Record<string, SecondaryDataSource>>
  >,
  filterRepoIds: string[] | null,
) => {
  // Make a copy of the data sources so we can invoke a state change when
  // setting state
  let copiedDataSources = {
    ...secondaryDataSources,
  }

  return Object.entries(copiedDataSources).map(([key, copiedDataSource]) =>
    filterRepoIds?.includes(copiedDataSource.repo.id) ? null : (
      <div
        className="py-1"
        style={{ display: 'flex', alignItems: 'center' }}
        key={key}
      >
        <Checkbox.Root
          className="flex items-center justify-center w-5 h-5 bg-white border border-gray-600 rounded-md shadow opacity-95 focus:opacity-100"
          id={copiedDataSource.repo.name}
          checked={copiedDataSource.checked}
          onCheckedChange={(checked) => {
            if (checked !== 'indeterminate') {
              copiedDataSources[copiedDataSource.repo.id].checked = checked
            }

            setSecondaryDataSources(copiedDataSources)
          }}
        >
          <Checkbox.Indicator>
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <label className="pl-2" htmlFor={key}>
          {copiedDataSource.repo.name}
        </label>
      </div>
    ),
  )
}

interface ProjectCreationDialogProps {
  user: User
  org: Organization
  open: boolean
  repos: Repository[]
  onDialogClosed: () => void
  onProjectCreated: (project: Project, assistant: Assistant) => void
}

// TODO: To complete
// * Make sure teh X button works

export const ProjectCreationDialog = ({
  user,
  org,
  open,
  repos,
  onDialogClosed,
  onProjectCreated,
}: ProjectCreationDialogProps) => {
  // TODO: Do I need this?
  const [projectName, setProjectName] = useState<string>('')
  const [primaryDataSource, setPrimaryDataSource] = useState<Repository | null>(
    null,
  )
  const [secondaryDataSources, setSecondaryDataSources] = useState<
    Record<string, SecondaryDataSource>
  >({})
  const [saveButtonEnabled, setSaveButtonEnabled] = useState<boolean>(true)

  // If either `open` or `repos` changes then just re-initialize the secondary
  // data sources forcing the user to select again
  useEffect(() => {
    const initialSecondaryDataSources = createInitialSecondaryDataSources(repos)
    setSecondaryDataSources(initialSecondaryDataSources)
  }, [open, repos])

  // Helper to reset all the details of the form once saved or closed
  const resetProjectDetails = () => {
    setProjectName('')
    setPrimaryDataSource(null)

    const initialSecondaryDataSources = createInitialSecondaryDataSources(repos)
    setSecondaryDataSources(initialSecondaryDataSources)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onDialogClosed()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Create a project adding details as well as specifying data sources
            for your project to improve learning and fine-tuning your model.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 space-y-1 text-sm border rounded-md">
          <div className="font-medium">
            Basic Project Details
            <div className="text-muted-foreground">
              <Label>
                Name
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </Label>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-1 text-sm border rounded-md">
          <div className="font-medium">Select Primary Data Source</div>
          <div className="text-muted-foreground">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="pl-0">
                  {primaryDataSource ? (
                    <span className="pl-1">{primaryDataSource.name}</span>
                  ) : (
                    <span className="flex pl-1 min-w-64 text-left">
                      Data Sources...
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                sideOffset={8}
                align="start"
                className="min-w-64"
              >
                {repos.map((repo) => (
                  <DropdownMenuItem
                    key={repo.name}
                    onSelect={(event) => {
                      // Firstly delete from the secondary data sources
                      // whatever was selected...
                      delete secondaryDataSources[repo.id]

                      // Add back the previously selected primary data
                      // source...
                      if (primaryDataSource) {
                        secondaryDataSources[primaryDataSource.id] = {
                          checked: false,
                          repo,
                        }
                      }

                      // Now update the primary data source...
                      setPrimaryDataSource(repo)
                    }}
                  >
                    <span className="ml-2 text-ellipsis whitespace-nowrap overflow-hidden">
                      {repo.name}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="p-4 space-y-1 text-sm border rounded-md">
          <div className="font-medium">Select Secondary Data Sources</div>
          <div className="text-muted-foreground">
            {!primaryDataSource ? (
              <span className="flex pl-1 min-w-64 text-left">
                Select primary data source...
              </span>
            ) : (
              <ScrollArea.Root>
                <ScrollArea.Viewport className="max-h-80">
                  <div style={{ padding: '15px 20px' }}>
                    {renderSecondaryDataSources(
                      secondaryDataSources,
                      setSecondaryDataSources,
                      primaryDataSource ? [primaryDataSource.id] : null,
                    )}
                  </div>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar orientation="vertical">
                  <ScrollArea.Thumb />
                </ScrollArea.Scrollbar>
                <ScrollArea.Corner />
              </ScrollArea.Root>
            )}
          </div>
        </div>
        <DialogFooter className="items-center">
          <Button
            variant="ghost"
            onClick={async (e) => {
              e.preventDefault()

              setSaveButtonEnabled(false)

              if (!projectName) {
                toast.error(`Please provide a project name`)
                setSaveButtonEnabled(true)
                return
              }

              if (titleSchema.validate(projectName).error) {
                toast.error(
                  `Project name can only be alphanumerics, -, and _ with alphanumerics at the beginning and end`,
                )
                setSaveButtonEnabled(true)
                return
              }

              if (!primaryDataSource) {
                toast.error(`Please select a primary data source`)
                setSaveButtonEnabled(true)
                return
              }

              const checkedSecondaryDataSources = Object.values(
                secondaryDataSources,
              )
                .filter((secondaryDataSource) => secondaryDataSource.checked)
                .map((secondaryDataSource) => secondaryDataSource.repo)

              try {
                const [project, assistant] = await createProject(
                  user,
                  org,
                  projectName,
                  primaryDataSource,
                  checkedSecondaryDataSources,
                )

                resetProjectDetails()
                onProjectCreated(project, assistant)
                setSaveButtonEnabled(true)
              } catch (err) {
                resetProjectDetails()
                setSaveButtonEnabled(true)

                toast.error(`Failed to create project`)
              }
            }}
          >
            {saveButtonEnabled ? (
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
            ) : (
              <svg
                aria-hidden="true"
                className="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
            )}
            {saveButtonEnabled ? 'Save' : 'Saving'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
