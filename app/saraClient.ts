type PATCHRequestBody = Record<any, any>
type POSTRequestBody = Record<any, any>

const prefixResourcePath = (resourcePath: string) => {
  if (!resourcePath.startsWith(`/api`)) {
    return `/api${resourcePath}`
  }

  return resourcePath
}

const throwIfResNotOk = async (
  res: Response,
  errorMessage: string = '',
): Promise<void> => {
  if (!res.ok) {
    const resErrText = await res.text()

    if (errorMessage.length === 0) {
      throw new Error(resErrText)
    }

    throw new Error(`${errorMessage} - ${resErrText}`)
  }
}

export const createResourceWithoutRequestBody = async (
  resourcePath: string,
  errorMessage: string = '',
): Promise<void> => {
  const prefixedResourcePath = prefixResourcePath(resourcePath)

  let res = null

  res = await fetch(prefixedResourcePath, {
    method: 'POST',
  })

  await throwIfResNotOk(res, errorMessage)
}

export const createResource = async <T>(
  resourcePath: string,
  reqBody: POSTRequestBody,
  errorMessage: string = '',
): Promise<T> => {
  const prefixedResourcePath = prefixResourcePath(resourcePath)

  const res = await fetch(prefixedResourcePath, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reqBody),
  })

  await throwIfResNotOk(res, errorMessage)

  return (await res.json()) as T
}

export const createResourceNoResponseBody = async (
  resourcePath: string,
  reqBody: POSTRequestBody,
  errorMessage: string = '',
): Promise<void> => {
  const prefixedResourcePath = prefixResourcePath(resourcePath)

  const res = await fetch(prefixedResourcePath, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reqBody),
  })

  await throwIfResNotOk(res, errorMessage)
}

export const getResource = async <T>(
  resourcePath: string,
  errorMessage: string = '',
): Promise<T> => {
  const prefixedResourcePath = prefixResourcePath(resourcePath)

  const res = await fetch(prefixedResourcePath)

  await throwIfResNotOk(res, errorMessage)

  return (await res.json()) as T
}

export const updateResource = async <T>(
  resourcePath: string,
  reqBody: PATCHRequestBody,
  errorMessage: string = '',
): Promise<T> => {
  const prefixedResourcePath = prefixResourcePath(resourcePath)

  const res = await fetch(prefixedResourcePath, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reqBody),
  })

  await throwIfResNotOk(res, errorMessage)

  return (await res.json()) as T
}

export const updateResourceNoResponseBody = async (
  resourcePath: string,
  reqBody: PATCHRequestBody,
  errorMessage: string = '',
): Promise<void> => {
  const prefixedResourcePath = prefixResourcePath(resourcePath)

  const res = await fetch(prefixedResourcePath, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reqBody),
  })

  await throwIfResNotOk(res, errorMessage)
}

export const deleteResource = async (
  resourcePath: string,
  errorMessage: string = '',
): Promise<void> => {
  const prefixedResourcePath = prefixResourcePath(resourcePath)

  const res = await fetch(prefixedResourcePath, {
    method: 'DELETE',
  })

  await throwIfResNotOk(res, errorMessage)
}
