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

  try {
    const response = await octokit.request('GET /orgs/' + org + '/repos', {
      type: 'all',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    //response has the repo array in the data field.  we just want the name
    return response.data.map((repo: { name: any }) => repo.name)
  } catch (error) {
    console.error('Error fetching repositories:', error)
    throw error
  }
}
