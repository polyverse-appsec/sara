import {
    type ProjectDataSource,
    type ProjectDataSourceAccessPermission,
  } from './../../data-model-types'
  import { createSignedHeader, USER_SERVICE_URI } from './utils'
  
  export interface BoostProjectResourceRequestBody {
    uri: string
    type: BoostProjectResourceTypeRequestBody
  }
  
  export const enum BoostProjectResourceTypeRequestBody {
    PrimaryRead = 'primary_read', // user read-only to source
    PrimaryReadWrite = 'primary_write', // user read/write to source
    ReferenceRead = 'reference_read', // user read-only to reference
  }
  
  type BoostProjectResourceAccessTypesByProjectDataSourceAccessPermissionKeys = {
    [projectDataSourceAccessPermissionKey in ProjectDataSourceAccessPermission]: BoostProjectResourceTypeRequestBody
  }
  
  const boostProjectResourceAccessTypesByProjectDataSourceAccessPermissionKeys: BoostProjectResourceAccessTypesByProjectDataSourceAccessPermissionKeys =
    {
      PRIMARY_READ: BoostProjectResourceTypeRequestBody.PrimaryRead,
      PRIMARY_READ_WRITE: BoostProjectResourceTypeRequestBody.PrimaryReadWrite,
      REFERENCE_READ: BoostProjectResourceTypeRequestBody.ReferenceRead,
    }
  
  export interface UserProjectRequestBody {
    org?: string
    name?: string
    owner?: string
    description?: string
    title?: string
    // guidelines are a keyed list of guidelines for the project
    guidelines?: Record<string, string>[]
    // resources: BoostProjectResourceRequestBody[]
    lastUpdated?: number
  }
  
  const UpdateBoostProject = async (
    projectId: string,
    orgName: string,
    name: string,
    description: string,
    guidelines: string[],
    email: string,
  ): Promise<void> => {
    const url = `${USER_SERVICE_URI}/api/user_project/${orgName}/${projectId}`
  
    // Create ordered array of guidelines, with each guideline having a key that
    // is its numeric order in list
    const orderedGuidelines = guidelines.map((guideline, index) => {
      return { [(index + 1).toString()]: guideline } as Record<string, string>
    })
  
    const signedHeader = createSignedHeader(email)

    const requestBody = {
        title: name,
        description,
        guidelines: orderedGuidelines,
      };
    
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...signedHeader,
      },
      body: JSON.stringify(requestBody),
    })
  
    if (!res.ok) {
      const resErrText = await res.text()
      const errMsg = `Got a failure response while trying to update project for '${orgName}/${projectId} for ${email}' - Status: ${res.status} - Error: ${resErrText}`
  
      console.error(errMsg)
  
      throw new Error(errMsg)
    }
  }
  
  export default UpdateBoostProject
  