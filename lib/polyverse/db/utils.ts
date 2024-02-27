import { v4 as uuidv4 } from 'uuid'

import { type BaseSaraObject } from './../../data-model-types'

export const createBaseSaraObject = (): BaseSaraObject => {
  const date = new Date()

  return {
    id: uuidv4(),
    createdAt: date,
    lastUpdatedAt: date,
  }
}
