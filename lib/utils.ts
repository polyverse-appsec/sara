import { clsx, type ClassValue } from 'clsx'
import isEqual from 'lodash/isEqual'
import orderBy from 'lodash/orderBy'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'

import { type PromptFileInfo } from './../lib/data-model-types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function isDateYesterday(dateToCheck: Date): boolean {
    const today = new Date(); // Get today's date
    const yesterday = new Date(today); // Create a new date object based on today

    yesterday.setDate(yesterday.getDate() - 1); // Subtract one day to get yesterday

    // Normalize both dates to midnight for accurate comparison
    const normalizedDateToCheck = new Date(dateToCheck);
    normalizedDateToCheck.setHours(0, 0, 0, 0);

    const normalizedYesterday = new Date(yesterday);
    normalizedYesterday.setHours(0, 0, 0, 0);

    return normalizedDateToCheck.getTime() === normalizedYesterday.getTime();
}

export function formatDateTimeSinceOperationOccurred(dateInput?: Date, pastTime: boolean = true): string {
    if (!dateInput) {
        if (pastTime) {
            return 'moments ago'
        } else {
            return 'a moment'
        }
    }

    const now = new Date()
    const date = new Date(dateInput)
    const diff = now.getTime() - date.getTime()

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    const isYesterday = isDateYesterday(date)

    if (seconds < 60) {
        return `${seconds} seconds` + (pastTime ? ' ago' : '');
    } else if (minutes < 60) {
        return `${minutes} minutes` + (pastTime ? ' ago' : '');
    } else if (hours < 24 && !isYesterday) {
        return `at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (isDateYesterday(date)) {
        return `at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} yesterday`;
    } else if (days < 7) {
        return `at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
    } else {
        const currentYear = now.getFullYear();
        const submittedYear = date.getFullYear();
        const optionsDate: Intl.DateTimeFormatOptions = {
            month: 'long',
            day: 'numeric',
            ...(submittedYear !== currentYear && { year: 'numeric' })
        };

        const formattedDate = new Intl.DateTimeFormat('en-US', optionsDate).format(date);
        const formattedTime = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);

        return `at ${formattedTime} on ${formattedDate}`
    }
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
