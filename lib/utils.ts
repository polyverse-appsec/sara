import { clsx, type ClassValue } from 'clsx'
import isEqual from 'lodash/isEqual'
import orderBy from 'lodash/orderBy'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'

import { type PromptFileInfo } from './../lib/data-model-types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDateForLastSynchronizedAt = (date: Date): string =>
  `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`

export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7,
) // 7-character random string

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<JSON> {
  const res = await fetch(input, init)

  if (!res.ok) {
    const json = await res.json()
    if (json.error) {
      const error = new Error(json.error) as Error & {
        status: number
      }
      error.status = res.status
      throw error
    } else {
      throw new Error('An unexpected error occurred')
    }
  }

  return res.json()
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export const promptFileInfosEqual = (
  thisPromptFileInfos: PromptFileInfo[],
  thatPromptFileInfos: PromptFileInfo[],
): boolean => {
  if (!thisPromptFileInfos && !thatPromptFileInfos) {
    return true
  }

  if (
    (!thisPromptFileInfos && thatPromptFileInfos) ||
    (thisPromptFileInfos && !thatPromptFileInfos)
  ) {
    return false
  }

  if (thisPromptFileInfos.length !== thatPromptFileInfos.length) {
    return false
  }

  // Stringify and parse the objects once to ensure that the objects can not
  // fail strict equality tests when it looks like the objects are in deed
  // copies of each other.
  const sortedThisPromptFileInfos = orderBy(thisPromptFileInfos, ['id']).map(
    (sortedThisPromptFileInfo) =>
      JSON.parse(JSON.stringify(sortedThisPromptFileInfo)),
  )

  const sortedThatPromptFileInfos = orderBy(thatPromptFileInfos, ['id']).map(
    (sortedThatPromptFileInfo) =>
      JSON.parse(JSON.stringify(sortedThatPromptFileInfo)),
  )

  return isEqual(sortedThisPromptFileInfos, sortedThatPromptFileInfos)
}
