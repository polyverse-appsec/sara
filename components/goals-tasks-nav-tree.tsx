'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import * as Label from '@radix-ui/react-label'
import * as Tooltip from '@radix-ui/react-tooltip'
import {
  Flex,
  HoverCard,
  Link as RadixLink,
  Strong,
  Text,
} from '@radix-ui/themes'
import CopyToClipboardIcon from 'components/icons/CopyToClipboardIcon'
import { useSession } from 'next-auth/react'
import { NodeRendererProps, Tree } from 'react-arborist'
import { toast } from 'react-hot-toast'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { SaraSession } from '../auth'
import { type Goal, type Task } from '../lib/data-model-types'
import { getResource } from './../app/saraClient'
import { MemoizedReactMarkdown } from './markdown'

interface GoalsTaskNavTreeProps {
  projectId: string
  activeGoalId: string | null
  activeTaskId: string | null
}

const getGoals = (projectId: string): Promise<Goal[]> =>
  new Promise(async (resolve, reject) => {
    try {
      const goals = await getResource<Goal[]>(
        `/projects/${projectId}/goals`,
        `Failed to get goals for goals & task tree`,
      )

      resolve(goals)
    } catch (error) {
      reject(
        `Request for GET /api/projects/${projectId}/goals failed because: ${error}`,
      )

      return
    }
  })

const getTasks = (goalId: string): Promise<Task[]> =>
  new Promise(async (resolve, reject) => {
    try {
      const tasks = await getResource<Task[]>(
        `/goals/${goalId}/tasks`,
        `Failed to get tasks for goals & task tree`,
      )

      resolve(tasks)
    } catch (error) {
      reject(
        `Request for GET /api/goals/${goalId}/tasks failed because: ${error}`,
      )

      return
    }
  })

const GoalResourceType = 'GOAL'
const TaskResourceType = 'TASK'
type NavigatableResourceTypes =
  | typeof GoalResourceType
  | typeof TaskResourceType

interface NavigatableGoalOrTaskResource {
  id: string
  name: string
  isActive: boolean
  type: NavigatableResourceTypes
  children?: NavigatableGoalOrTaskResource[]

  description?: string
  acceptanceCriteria?: string
  status?: string
}

const renderGoalIcon = () => CheckedSquareIcon()
/*
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
    />
  </svg>
  */

const renderTaskIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
    />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M6 6h.008v.008H6V6Z"
    />
  </svg>
)

const CheckedSquareIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <path d="M9 11l3 3 5-5"></path>
  </svg>
)

const UncheckedCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="9"></circle>
  </svg>
)

const CheckedCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="9"></circle>
    <path d="M9 12l2 2 4-4"></path>
  </svg>
)

const TargetIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
    <line x1="12" y1="2" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="2" y1="12" x2="4" y2="12" />
    <line x1="20" y1="12" x2="22" y2="12" />
  </svg>
)

const ToDoTaskIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M9 10h.01M9 6h.01M9 14h.01M5 18h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

const InProgressTaskIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M12 4v16m8-8H4" />
  </svg>
)

const CompletedTaskIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const renderGoalOrTaskStatusIcon = (type: string, status: string) => {
  if (type === GoalResourceType) {
    return renderGoalIcon()
  } else if (status === 'OPEN' || status === 'TODO') {
    return UncheckedCircleIcon()
  } else if (status === 'IN_PROGRESS') {
    return InProgressTaskIcon()
  } else if (status === 'DONE') {
    return CheckedCircleIcon()
  } else {
    return ToDoTaskIcon()
  }
}

const getNodeMarkdown = (
  navigatableResource: NavigatableGoalOrTaskResource,
) => {
  let markdown = ''
  if (navigatableResource.type === 'GOAL') {
    markdown += `# Goal: ${navigatableResource.name}\n`
  } else {
    markdown += `# Task: ${navigatableResource.name}\n`
  }

  if (navigatableResource.status) {
    markdown += `## Status\n${navigatableResource.status}\n`
  }

  if (navigatableResource.description) {
    markdown += `## Description\n${navigatableResource.description}\n`
  }

  if (navigatableResource.acceptanceCriteria) {
    markdown += `## Acceptance Criteria\n${navigatableResource.acceptanceCriteria
      .split(`\n`)
      .join(`\n###`)}\n`
  }

  return markdown
}

const renderNodeName = (
  copyToClipboard: (title: string, text: string) => void,
  copied: boolean,
  navigatableResource: NavigatableGoalOrTaskResource,
) => {
  const resourceType = navigatableResource.type === 'GOAL' ? 'Goal' : 'Task'

  return (
    <HoverCard.Root>
      <HoverCard.Trigger>
        {navigatableResource.type === GoalResourceType ? (
          <Link
            href={`/goals/${navigatableResource.id}`}
            title={navigatableResource.name}
          >
            {navigatableResource.isActive ? (
              <Text
                weight="bold"
                color="green"
                title={navigatableResource.name}
              >
                {navigatableResource.name}
              </Text>
            ) : (
              <Text title={navigatableResource.name}>
                {navigatableResource.name}
              </Text>
            )}
          </Link>
        ) : (
          <Text title={navigatableResource.name}>
            {navigatableResource.name}
          </Text>
        )}
      </HoverCard.Trigger>
      <HoverCard.Content>
        <Flex
          className="mb-2 font-semibold p-2 bg-background rounded-lg blue-border break-words"
          justify="between"
          gap="1"
        >
          <Flex align="start" gap="1">
            <Text>
              <Strong>{resourceType}:</Strong>
            </Text>

            {navigatableResource.type === 'GOAL' ? (
              <Link
                href={`/goals/${navigatableResource.id}`}
                className="hover:text-orange-500"
              >
                <Text>{navigatableResource.name}</Text>
              </Link>
            ) : (
              <Text>{navigatableResource.name}</Text>
            )}
          </Flex>

          {/* This div is aligned to the right and contains the clipboard icon */}
          <Tooltip.Root>
            <Tooltip.Provider>
              <Tooltip.Trigger
                className="flex items-center cursor-pointer"
                onClick={() =>
                  copyToClipboard(
                    `${resourceType}: ${navigatableResource.name}`,
                    getNodeMarkdown(navigatableResource),
                  )
                }
              >
                <CopyToClipboardIcon copied={copied} color="#6B7280" />
              </Tooltip.Trigger>
              <Tooltip.Content
                side="right"
                align="end"
                className="clipboardCopyToolTip"
              >
                Copy {resourceType} to Clipboard
              </Tooltip.Content>
            </Tooltip.Provider>
          </Tooltip.Root>
        </Flex>

        <Flex className="p-2 bg-background rounded-lg blue-border break-words">
          <Flex direction="column" gap="1">
            {/*navigatableResource.status && (
                    <div className="flex flex-col">
                        <span className="font-semibold mr-2">Status: {renderGoalOrTaskStatusIcon(navigatableResource.type, navigatableResource.status)}</span>
                    </div>
                )*/}
            {navigatableResource.acceptanceCriteria && (
              <Flex direction="column" gap="1">
                <MemoizedReactMarkdown
                  className="markdownDisplay"
                  remarkPlugins={[remarkGfm, remarkMath]}
                  components={{
                    p({ children }) {
                      return <p className="mb-2 last:mb-0">{children}</p>
                    },
                  }}
                >
                  {navigatableResource.description !== undefined
                    ? navigatableResource.description
                    : 'No description available'}
                </MemoizedReactMarkdown>
              </Flex>
            )}
            {navigatableResource.acceptanceCriteria && (
              <Flex direction="column" gap="1">
                <br />
                <p className="font-semibold">Acceptance Criteria</p>
                {/* indent */}
                <Flex direction="column" gap="1">
                  <MemoizedReactMarkdown
                    className="markdownDisplay"
                    remarkPlugins={[remarkGfm, remarkMath]}
                    components={{
                      p({ children }) {
                        return <p className="mb-2 last:mb-0">{children}</p>
                      },
                    }}
                  >
                    {navigatableResource.acceptanceCriteria}
                  </MemoizedReactMarkdown>
                </Flex>
              </Flex>
            )}
          </Flex>
        </Flex>
      </HoverCard.Content>
    </HoverCard.Root>
  )
}

const renderGoalOrTaskNode = ({
  node,
  style,
  dragHandle,
  copyToClipboard, // Ensure these are listed in the destructured props
  copied,
}: NodeRendererProps<NavigatableGoalOrTaskResource> & {
  copyToClipboard: (title: string, text: string) => void
  copied: boolean
}) => {
  return (
    <div
      style={{
        ...style,
        whiteSpace: 'nowrap',
      }}
      ref={dragHandle}
    >
      <div className="flex">
        <span>
          {node.data.type === GoalResourceType
            ? renderGoalIcon()
            : (node.data as NavigatableGoalOrTaskResource).status !== undefined
              ? renderGoalOrTaskStatusIcon(
                  node.data.type,
                  (node.data as NavigatableGoalOrTaskResource).status!,
                )
              : renderTaskIcon()}
        </span>
        <span
          className={
            node.data.type === GoalResourceType ? 'hover:text-orange-500' : ''
          }
        >
          {renderNodeName(copyToClipboard, copied, node.data)}
        </span>
      </div>
    </div>
  )
}

const GoalsTaskNavTree = ({
  projectId,
  activeGoalId,
  activeTaskId,
}: GoalsTaskNavTreeProps) => {
  const [goalsTasksTreeData, setGoalsTasksTreeData] = useState<
    undefined | NavigatableGoalOrTaskResource[]
  >(undefined)

  const [copied, setCopied] = useState(false)

  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  useEffect(() => {
    let isMounted = true
    const loadResourcesFrequencyMilliseconds = 10000

    const loadResources = async () => {
      try {
        const goals = await getGoals(projectId)

        const mapNavResourceTreePromises = goals.map(async (goal) => {
          const tasks = await getTasks(goal.id)

          return {
            id: goal.id,
            name: goal.name,
            isActive: goal.id === activeGoalId,
            type: GoalResourceType,

            description: goal.description,
            acceptanceCriteria: goal.acceptanceCriteria,
            status: goal.status,

            children: tasks.map(
              (task) =>
                ({
                  id: task.id,
                  name: task.name,
                  isActive: task.id === activeTaskId,
                  type: TaskResourceType,
                  children: [],

                  description: task.description,
                  acceptanceCriteria: task.acceptanceCriteria,
                  status: task.status,
                }) as NavigatableGoalOrTaskResource,
            ),
          } as NavigatableGoalOrTaskResource
        })

        const navResourceTree = await Promise.all(mapNavResourceTreePromises)

        // Only set the data in the event we are still mounted. If we don't
        // perform this check then we can get flickering of the nav bar between
        // old and new data as this `useEffect` function is fired again from a
        // new active goal/task ID
        if (isMounted) {
          setGoalsTasksTreeData(navResourceTree)
        }
      } catch (error) {
        console.debug(
          `Failed to load resources for project ${projectId} because: ${error}`,
        )
      }

      // Try again all over regardless of failure or success...
      if (isMounted) {
        setTimeout(loadResources, loadResourcesFrequencyMilliseconds)
      }
    }

    loadResources()

    return () => {
      isMounted = false
    }
  }, [projectId, activeGoalId, activeTaskId])

  if (!saraSession) {
    return null
  }

  const copyToClipboard = (title: string, text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true)
        toast.success(`${title} copied to clipboard`)
        const timeoutId = setTimeout(() => setCopied(false), 2000)
        // Cleanup function to clear timeout if component unmounts
        return () => clearTimeout(timeoutId)
      },
      (err) => {
        console.error(
          `${saraSession.email} Failed to copy ID to clipboard:`,
          err,
        )
        setCopied(false)
      },
    )
  }

  // Note that our `<Tree>` is a controlled component since we pass our goals
  // and tasks in through `data`. We need to eventually add handlers to it if
  // we want to enable any of its functionality.
  return (
    <>
      <div className="flex flex-col items-center">
        <Label.Root className="font-semibold" style={{ marginBottom: '0px' }}>
          Goals & Tasks Explorer
        </Label.Root>
      </div>
      <Flex direction="column" align="center">
        <div className="w-full border-t rounded-xl border-blue-600 my-2"></div>
      </Flex>
      {goalsTasksTreeData === undefined ? (
        <div className="flex flex-col items-center">
          <Text size="2" className="text-center italic text-gray-500">
            Loading
          </Text>
        </div>
      ) : (
        <div className="text-sm">
          <Tree
            className="overflow-y-auto overflow-x-visible"
            data={goalsTasksTreeData}
          >
            {(props) =>
              renderGoalOrTaskNode({ ...props, copyToClipboard, copied })
            }
          </Tree>
        </div>
      )}
    </>
  )
}

export default GoalsTaskNavTree
