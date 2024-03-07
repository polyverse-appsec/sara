import { clsx, type ClassValue } from 'clsx'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'

import isEqual from 'lodash/isEqual'
import orderBy from 'lodash/orderBy'

import {
    type PromptFileInfo,
} from './../lib/data-model-types'

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
  console.debug(
    `Checking to see if this and that prompt file infos are equal - this: ${JSON.stringify(
      thisPromptFileInfos,
    )} - that: ${JSON.stringify(thatPromptFileInfos)}`,
  )

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

  const sortedThisFileInfos = orderBy(thisPromptFileInfos, ['id'])
  const sortedThatFileInfos = orderBy(thatPromptFileInfos, ['id'])

  return isEqual(sortedThisFileInfos, sortedThatFileInfos)
}
