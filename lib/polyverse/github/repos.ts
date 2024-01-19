import { Octokit } from '@octokit/rest'
import { kv } from '@vercel/kv'

import { Organization, Repository } from '@/lib/dataModelTypes'

// Define a type for the function's parameters
export type FetchUserOrgsParams = {
  accessToken: string
}

// Function to fetch user's organizations
export async function fetchUserOrganizations({
  accessToken,
}: FetchUserOrgsParams): Promise<Organization[]> {
  const octokit = new Octokit({
    auth: accessToken,
  })

  try {
    const response = await octokit.request('GET /user/orgs', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    return response.data.map((org) => ({
      login: org.login,
      avatar_url: org.avatar_url,
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
  org,
}: FetchOrgReposParams): Promise<Repository[]> {
  const octokit = new Octokit({
    auth: accessToken,
  })
  let page = 1
  const repos = []

  try {
    while (true) {
      // the api /user/repos is supposed to return all repos for the user, but it doesn't seem to work
      // for private repos unless we have the repo permission. but if we have the repo permission,
      // we can use the more direct /orgs/:org/repos api
      const response = await octokit.request('GET /orgs/' + org + '/repos', {
        type: 'all',
        per_page: 100,
        page: page,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })

      if (response.data.length === 0) {
        break // Exit the loop if no more repos are returned
      }

      repos.push(
        ...response.data.map(
          (repo: {
            name: any
            description: any
            full_name: string
            html_url: string
          }) => ({
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            html_url: repo.html_url,
            orgId: org,
          }),
        ),
      )
      page++
    }

    return repos
  } catch (error) {
    console.error('Error fetching repositories:', error)
    throw error
  }
}

export async function getOrCreateRepoFromGithubRepo(
  repo: Repository,
  userId: string,
): Promise<Repository> {
  const repoId = `repo:${repo.full_name}:${userId}`
  const existingRepo = (await kv.get(repoId)) as Repository
  if (existingRepo) {
    return existingRepo
  }
  const newRepo = {
    ...repo,
    id: repoId,
    userId: userId,
  }
  await kv.set(repoId, newRepo)
  return newRepo
}
