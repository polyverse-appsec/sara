import { kv } from '@vercel/kv'

import { type ProjectPartDeux } from './../../data-model-types'
import { globalProjectIdsSetKey, projectKey } from './keys'

// TODO: Have to temporarily name this as `createProjecDb` as we have an action named `createProject`
const createProjecDb = async (project: ProjectPartDeux): Promise<void> => {
  // Create the new project...
  const itemKey = projectKey(project.id)

  await kv.hset(itemKey, project)

  // Track our new project globally...
  const projectIdsSetKey = globalProjectIdsSetKey()
  await kv.zadd(projectIdsSetKey, {
    score: +new Date(),
    member: project.id,
  })
}

export default createProjecDb
