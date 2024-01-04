import { Repository, ProjectDataReference } from '../../types'

const USER_PROJECT_URL_BASE =
  'https://pt5sl5vwfjn6lsr2k6szuvfhnq0vaxhl.lambda-url.us-west-2.on.aws/api/user_project'

/**
 * Gets the files IDs associated with a user and a Git repo.
 *
 * @param repo {string} Git URL for a repo.
 * @param email {string} Email associated with user.
 * @returns {Promise<string[]>} Promise of an array of strings. Array will be empty in the event of an error.
 */
export async function getFileIDs(
  repo: Repository,
  email: string
): Promise<ProjectDataReference[]> {
  const url = `${USER_PROJECT_URL_BASE}/${repo.orgId}/${repo.name}/data_references`

  console.log(`getFileIDs - url: ${url}`)
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-user-account': email
      }
    })

    if (!res.ok) {
      console.error(
        `Got a failure response while trying to get file ids for '${repo.orgId}/${repo.name} for ${email}' - Status: ${res.status}`
      )
      return []
    }

    const json = await res.json()
    console.log(`getFileIDs - json: ${JSON.stringify(json)}`)
    //json should be an array of ProjectDataReference objects
    return json as ProjectDataReference[]
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
  const url = `${USER_PROJECT_URL_BASE}/${repo.orgId}/${repo.name}`

  console.log(`tickleProject - url: ${url}`)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-user-account': email
      },
      body: JSON.stringify({ resources: [repo.html_url] })
    })

    if (!res.ok) {
      console.error(
        `Got a failure response while trying to start project for '${repo.orgId}/${repo.name} for ${email}' - Status: ${res.status}`
      )
      return ''
    }

    return ''
  } catch (error) {
    console.error(
      'Error making a request or parsing a response for project ID: ',
      error
    )
  }

  return ''
}
