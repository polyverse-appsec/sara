export const getResource = async <T>(resourcePath: string, errorMessage: string = ''): Promise<T> => {
    let prefixedResourcePath = resourcePath

    if (!resourcePath.startsWith(`/api`)) {
        prefixedResourcePath = `/api${resourcePath}`
    }

    const res = await fetch(prefixedResourcePath)

    if (!res.ok) {
      const resErrText = await res.text()

      if (errorMessage.length === 0) {
        throw new Error(resErrText)
      }


      throw new Error(
        `${errorMessage} - ${resErrText}`,
      )
    }
  
    return (await res.json()) as T
}