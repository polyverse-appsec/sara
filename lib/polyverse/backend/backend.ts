const GET_VECTORDATA_FROM_PROJECT_URL = 'https://pt5sl5vwfjn6lsr2k6szuvfhnq0vaxhl.lambda-url.us-west-2.on.aws/api/get_vectordata_from_project'

const buildGetVectorDataFromProjectURL = (repo: string, email: string) => `${GET_VECTORDATA_FROM_PROJECT_URL}?uri=${encodeURIComponent(repo)}&email=${encodeURIComponent(email)}`

/**
 * Gets the files IDs associated with a user and a Git repo.
 * 
 * @param repo {string} Git URL for a repo.
 * @param email {string} Email associated with user.
 * @returns {Promise<string[]>} Promise of an array of strings. Array will be empty in the event of an error.
 */
export async function getFileIDs(repo: string, email: string): Promise<string[]> {
    const url = buildGetVectorDataFromProjectURL(repo, email)
  
    try {
      const res = await fetch(url)
  
      if (!res.ok) {
        // TODO: Log to 3rd party service
        console.error(`Got a failure response while trying to get file IDs for '${repo}/${email}' - Status: ${res.status}`)
        return []
      }
  
      const rawData = await res.json()
      const fileIDs = JSON.parse(rawData.body)
      
      console.log(`Parsed file IDs: ${fileIDs}`)
  
      return fileIDs
    } catch (error) {
      // TODO: Log to 3rd party service
      console.error('Error making a request or parsing a response for file IDs: ', error)
    }
  
    return []
  }