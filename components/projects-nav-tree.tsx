'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import * as Label from '@radix-ui/react-label'
import getOrgProjects from 'app/rest-requests/get-org-projects'
import { ProjectPartDeux } from 'lib/data-model-types'
import { useAppContext } from 'lib/hooks/app-context'
import { NodeRendererProps, Tree } from 'react-arborist'

interface NavigatableProjectResource extends ProjectPartDeux {
  children?: NavigatableProjectResource[]
  isActive: boolean
}

const renderProjectIcon = (isActiveProject: boolean) => {
  // If the project is the active one show the folder as being open
  if (isActiveProject) {
    return (
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
          d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776"
        />
      </svg>
    )
  }

  return (
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
        d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
      />
    </svg>
  )
}

const renderProjectNode = ({
  node,
  style,
  dragHandle,
}: NodeRendererProps<NavigatableProjectResource>) => (
  <div
    style={{
      ...style,
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    }}
    ref={dragHandle}
  >
    <div className="flex">
      <span>{renderProjectIcon(node.data.isActive)}</span>
      <span>
        <Link href={`/projects/${node.data.id}`}>
          {node.data.isActive ? (
            <div className="text-green-500">{node.data.name}</div>
          ) : (
            node.data.name
          )}
        </Link>
      </span>
    </div>
  </div>
)

const ProjectsNavTree = () => {
  const { activeBillingOrg, projectIdForConfiguration } = useAppContext()
  const [projects, setProjects] = useState<ProjectPartDeux[]>([])

  useEffect(() => {
    let isMounted = true
    let loadOrgProjectsFrequencyMilliseconds = 5000

    const loadOrgProjects = async () => {
      if (!activeBillingOrg) {
        // Make sure to clear our projects if there aren't any to render
        setProjects([])

        if (isMounted) {
          setTimeout(loadOrgProjects, loadOrgProjectsFrequencyMilliseconds)
        }

        return
      }

      try {
        const projects = await getOrgProjects(activeBillingOrg.id)
        setProjects(projects)
      } catch (error) {
        console.log(`Failed to sync org level details because: ${error}`)
      }

      if (isMounted) {
        setTimeout(loadOrgProjects, loadOrgProjectsFrequencyMilliseconds)
      }
    }

    loadOrgProjects()

    return () => {
      // If we are cleaning up as a result of changed dependencies make sure
      // that we clear our projects so we no longer render the old projects
      setProjects([])
      isMounted = false
    }
  }, [activeBillingOrg])

  const projectsTreeData = projects.map(
    (project) =>
      ({
        ...project,
        children: [],
        // We set this here rather than in `useEffect` as setting it in
        // `useEffect` requires it to be a reactive value as becomes a local
        // closure around it. This creates a lag/flickering between the old
        // old rendered values as this is an async function and can be in
        // flight from the old project we are configuring for even though
        // the user selected a different one.
        isActive: project.id === projectIdForConfiguration,
      }) as NavigatableProjectResource,
  )

  // Note that our `<Tree>` is a controlled component since we pass our goals
  // and tasks in through `data`. We need to eventually add handlers to it if
  // we want to enable any of its functionality.
  return (
    <>
      <div className="flex flex-col items-center">
        <Label.Root>Project Explorer</Label.Root>
      </div>
      <br />
      <Tree data={projectsTreeData}>{renderProjectNode}</Tree>
    </>
  )
}

export default ProjectsNavTree
