import { Octokit } from '@octokit/rest'

// Define a type for the function's parameters
export type FetchUserOrgsParams = {
  accessToken: string
}

// Define the simplified Organization type
export type Organization = {
  login: string // The organization's login name
  avatar_url: string // The URL of the organization's avatar
}

// Function to fetch user's organizations
export async function fetchUserOrganizations({
  accessToken
}: FetchUserOrgsParams): Promise<Organization[]> {
  const octokit = new Octokit({
    auth: accessToken
  })

  try {
    const response = await octokit.request('GET /user/orgs', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    return response.data.map(org => ({
      login: org.login,
      avatar_url: org.avatar_url
    }))
  } catch (error) {
    console.error('Error fetching organizations:', error)
    throw error
  }
}

// Define a type for the function's parameters
export type FetchOrgReposParams = {
  accessToken: string
  org: string
}

// Function to fetch repositories for an organization
export async function fetchOrganizationRepositories({
  accessToken,
  org
}: FetchOrgReposParams): Promise<string[]> {
  const octokit = new Octokit({
    auth: accessToken
  })
  let page = 1
  const repoNames = []

  try {
    while (true) {
      const response = await octokit.request('GET /user/repos', {
        visibility: 'all',
        per_page: 100,
        page: page,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })

      if (response.data.length === 0) {
        break // Exit the loop if no more repos are returned
      }

      repoNames.push(...response.data.map((repo: { name: any }) => repo.name))

      console.log(
        `Fetched page ${page}:`,
        response.data.map((repo: { name: any }) => repo.name)
      )
      page++
    }

    return repoNames
  } catch (error) {
    console.error('Error fetching repositories:', error)
    throw error
  }
}
