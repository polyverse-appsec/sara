import { ProjectPartDeux } from './../../lib/data-model-types'

const getOrgProjects = async (orgId: string): Promise<ProjectPartDeux[]> => {
  const res = await fetch(`/api/orgs/${orgId}/projects`)

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(
      `Failed to get projects for org '${orgId}' because: ${errText}`,
    )
  }

  return (await res.json()) as ProjectPartDeux[]
}

export default getOrgProjects
