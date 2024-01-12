import { Repository, ProjectDataReference } from '@/lib/dataModelTypes'

const USER_PROJECT_URL_BASE =
  'https://pt5sl5vwfjn6lsr2k6szuvfhnq0vaxhl.lambda-url.us-west-2.on.aws/api/user_project'

/**
 * Gets the files IDs associated with a user and a Git repo.
 *
 * @param repo {string} Git URL for a repo.
 * @param email {string} Email associated with user.
 * @returns {Promise<string[]>} Promise of an array of strings. Array will be empty in the event of an error.
 */
export async function getFileInfo(
  repo: Repository,
  email: string
): Promise<ProjectDataReference[]> {
  const url = `${USER_PROJECT_URL_BASE}/${repo.orgId}/${repo.name}/data_references`

  try {
    console.log(`***** backend.ts#getFileInfo - url: ${url}`)
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-user-account': email
      }
    })

    if (!res.ok) {
      console.error(
        `***** backend.ts#getFileInfo - Got a failure response while trying to get file ids for '${repo.orgId}/${repo.name} for ${email}' - Status: ${res.status}`
      )
      console.error(`***** backend.ts#getFileInfo - Error response body: ${await res.text()}`)
      return []
    }

    const fileInfo = await res.json()
    //json should be an array of ProjectDataReference objects
    return fileInfo as ProjectDataReference[]
  } catch (error) {
    console.error(
      'Error making a request or parsing a response for project ID: ',
      error
    )
  }
  return []
}

export async function tickleProject(
  repo: Repository,
  email: string
): Promise<string> {
  const url = `${USER_PROJECT_URL_BASE}/${repo.orgId}/${repo.name}/data_references`

  try {
    const body = JSON.stringify({ resources: [{"uri": repo.html_url}] })

    console.log(`tickleProject - url: ${url} - email: ${email} - body: ${body}`)

    // TODO: Old body when we thought tickle was the above URL without `data_references`
    // const res = await fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     'x-user-account': email,
    //     'Content-Type': 'application/json'
    //   },
    //   body
    // })

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-user-account': email
      }
    })

    if (!res.ok) {
      console.log(`***** backend.ts#tickleProject - Got a failure response while trying to start project: ${await res.text()}`)
      console.error(
        `Got a failure response while trying to start project for '${repo.orgId}/${repo.name} for ${email}' - Status: ${res.status}`
      )
      return ''
    }

    console.log(`***** backend.ts#tickleProject - exiting inside of try/catch`)
    return ''
  } catch (error) {
    console.log(`***** backend.ts#tickleProject - Error making a request`)
    console.error(
      'Error making a request or parsing a response for project ID: ',
      error
    )
  }

  console.log(`***** backend.ts#tickleProject - exiting outside of try/catch`)

  return ''
}

/**
 * Helper method that creates a shallow copy of the given object with all properties
 * that evaluate to undefined removed. This does not modify the original object.
 *
 * This is useful to invoke on objects before you hash them in Redis. Failure to do
 * so can result in errors such as:
 * ⨯ UpstashError: ERR unsupported arg type: %!q(<nil>): <nil>
 *
 * @param {object} objectToStrip Object from which undefined properties will be stripped.
 * @returns {Record<string, any>} A new object with undefined properties removed.
 */
export function stripUndefinedObjectProperties(
  objectToStrip: any
): Record<string, any> {
  // Guard against `null` as it is considered an object in JS
  if (typeof objectToStrip !== 'object' || objectToStrip === null) {
    return objectToStrip
  }

  const strippedObject: Record<string, any> = {}
  Object.keys(objectToStrip).forEach(key => {
    if (objectToStrip[key] !== undefined) {
      strippedObject[key] = objectToStrip[key]
    } else {
      console.log(`Stripping key '${key}' from object`)
      console.log(
        'BUGBUGBUBUGBUG: WE SHOULD NEVER GET HERE!! SOMETHING IS WRONG'
      )
    }
  })

  return strippedObject
}
