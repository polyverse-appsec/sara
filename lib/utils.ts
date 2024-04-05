import { clsx, type ClassValue } from 'clsx'
import isEqual from 'lodash/isEqual'
import orderBy from 'lodash/orderBy'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'

import { type PromptFileInfo } from './../lib/data-model-types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isPreviewFeatureEnabled = (feature: string, email: string = ''): boolean => {
  if (!process.env.NEXT_PUBLIC_PREVIEW_FEATURES) {
    return false
  }

  feature = feature.toLowerCase()
  email = email?.toLowerCase()
  const publicPreviewFeatures = process.env.NEXT_PUBLIC_PREVIEW_FEATURES?.toLowerCase()

  // features are stored as a comma-delimited list of key-value pairs
  //    e.g. Foo,Bar
  //    e.g. Foo=test@polyverse.com,Bar=@polyverse.com

  // first grab the list of features (key/value or key only) that are enabled
  const featuresEnabled = publicPreviewFeatures.split(',')

  if (featuresEnabled.includes(feature)) {
    console.log(`[${process.env.SARA_STAGE} Deployment] Preview Feature: ${feature} = ENABLED for all users`)
    return true
  }

  try {
      // now check if the feature is enabled for the current user
    const featureEnabled = featuresEnabled.some((f) => {
      const [featureKey, emailValue] = f.split('=')

      if (featureKey === feature) {
        if (!emailValue) {
          // if the feature is enabled for all users, return true
          console.log(`[${process.env.SARA_STAGE} Deployment] Preview Feature: ${feature} = ENABLED for all users`)
          return true
        }

        // if the feature is enabled for a specific user, check if the current user matches
        if (emailValue === email) {
            console.log(`[${process.env.SARA_STAGE} Deployment] Preview Feature: ${feature} = ENABLED for ${email}`)
            return true
        } else if (emailValue.includes('@') && email.includes('@')) {
            // if the feature is enabled for a domain, check if the current user's email domain matches
            const domain = email.split('@')[1] || '';
            if (emailValue === `@${domain}`) {
              console.log(`[${process.env.SARA_STAGE} Deployment] Preview Feature: ${feature} = ENABLED for @${domain}`);
              return true;
            }
          }
      }

      return false
    })

    if (!featureEnabled) {
      console.log(`[${process.env.SARA_STAGE} Deployment] Preview Feature: ${feature} = DISABLED`)
    }

    return featureEnabled
  } catch (error) {
    console.error(`Error checking if preview feature ${feature} for ${email} with ${process.env.NEXT_PUBLIC_PREVIEW_FEATURES} is enabled: ${error}`)
    return false
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
