import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import {
  BaseSaraObjectSchema,
  type BaseSaraObject,
} from './../../lib/data-model-types'

use(chaiAsPromised)

describe(`Data Model Schema Validation`, function () {
  describe(`'BaseSaraObjectSchema' Validation`, function () {
    it(`Fails if 'id' is missing`, function () {
      const baseSaraObject = {} as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.exist
      expect(validationError?.message).to.exist
      expect(validationError?.message).to.equal(`"id" is required`)
    })

    it(`Fails if 'id' is 'undefined'`, function () {
      // @ts-expect-error Purposely exclude properties or set to
      // disallowed TypeScript values for testing schema validation
      const baseSaraObject = {
        id: undefined,
      } as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.exist
      expect(validationError?.message).to.exist
      expect(validationError?.message).to.equal(`"id" is required`)
    })

    it(`Fails if 'id' is 'null'`, function () {
      // @ts-expect-error Purposely exclude properties or set to
      // disallowed TypeScript values for testing schema validation
      const baseSaraObject = {
        id: null,
      } as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.exist
      expect(validationError?.message).to.exist
      expect(validationError?.message).to.equal(`"id" must be a string`)
    })

    it(`Fails if 'id' is the empty string`, function () {
      const baseSaraObject = {
        id: '',
      } as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.exist
      expect(validationError?.message).to.exist
      expect(validationError?.message).to.equal(
        `"id" is not allowed to be empty`,
      )
    })

    it(`Fails if 'createdAt' is missing`, function () {
      const baseSaraObject = {
        id: 'someValidId',
      } as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.exist
      expect(validationError?.message).to.exist
      expect(validationError?.message).to.equal(`"createdAt" is required`)
    })

    it(`Fails if 'createdAt' is 'undefined'`, function () {
      // @ts-expect-error Purposely exclude properties or set to
      // disallowed TypeScript values for testing schema validation
      const baseSaraObject = {
        id: 'someValidId',
        createdAt: undefined,
      } as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.exist
      expect(validationError?.message).to.exist
      expect(validationError?.message).to.equal(`"createdAt" is required`)
    })

    it(`Fails if 'createdAt' is 'null'`, function () {
      // @ts-expect-error Purposely exclude properties or set to
      // disallowed TypeScript values for testing schema validation
      const baseSaraObject = {
        id: 'someValidId',
        createdAt: null,
      } as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.exist
      expect(validationError?.message).to.exist
      expect(validationError?.message).to.equal(
        `"createdAt" must be a valid date`,
      )
    })

    it(`Fails if 'createdAt' isn't a date`, function () {
      // @ts-expect-error Purposely exclude properties or set to
      // disallowed TypeScript values for testing schema validation
      const baseSaraObject = {
        id: 'someValidId',
        createdAt: 'clearlyNotADate',
      } as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.exist
      expect(validationError?.message).to.exist
      expect(validationError?.message).to.equal(
        `"createdAt" must be in timestamp or number of milliseconds format`,
      )
    })

    it(`Fails if 'createdAt' is below the min allowed value`, function () {
      // @ts-expect-error Purposely exclude properties or set to
      // disallowed TypeScript values for testing schema validation
      const baseSaraObject = {
        id: 'someValidId',
        // 01-01-2023
        createdAt: 1672560000000,
      } as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.exist
      expect(validationError?.message).to.exist
      expect(validationError?.message).to.equal(
        `"createdAt" must be greater than or equal to "2023-12-25T00:00:00.000Z"`,
      )
    })

    it(`Fails if 'createdAt' is above the max allowed value`, function () {
      // @ts-expect-error Purposely exclude properties or set to
      // disallowed TypeScript values for testing schema validation
      const baseSaraObject = {
        id: 'someValidId',
        // 01-01-2100
        createdAt: 4102473600000,
      } as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.exist
      expect(validationError?.message).to.exist
      expect(validationError?.message).to.equal(
        `"createdAt" must be less than or equal to "now"`,
      )
    })

    it(`Fails if 'lastUpdatedAt' is missing`, function () {
      const baseSaraObject = {
        id: 'someValidId',
        createdAt: new Date(),
      } as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.exist
      expect(validationError?.message).to.exist
      expect(validationError?.message).to.equal(`"lastUpdatedAt" is required`)
    })

    it(`Fails if 'lastUpdatedAt' is 'undefined'`, function () {
      // @ts-expect-error Purposely exclude properties or set to
      // disallowed TypeScript values for testing schema validation
      const baseSaraObject = {
        id: 'someValidId',
        createdAt: new Date(),
        lastUpdatedAt: undefined,
      } as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.exist
      expect(validationError?.message).to.exist
      expect(validationError?.message).to.equal(`"lastUpdatedAt" is required`)
    })

    it(`Fails if 'lastUpdatedAt' is 'null'`, function () {
      // @ts-expect-error Purposely exclude properties or set to
      // disallowed TypeScript values for testing schema validation
      const baseSaraObject = {
        id: 'someValidId',
        createdAt: new Date(),
        lastUpdatedAt: null,
      } as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.exist
      expect(validationError?.message).to.exist
      expect(validationError?.message).to.equal(
        `"lastUpdatedAt" must be a valid date`,
      )
    })

    it(`Fails if 'lastUpdatedAt' isn't a date`, function () {
      // @ts-expect-error Purposely exclude properties or set to
      // disallowed TypeScript values for testing schema validation
      const baseSaraObject = {
        id: 'someValidId',
        createdAt: new Date(),
        lastUpdatedAt: 'clearlyNotADate',
      } as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.exist
      expect(validationError?.message).to.exist
      expect(validationError?.message).to.equal(
        `"lastUpdatedAt" must be in timestamp or number of milliseconds format`,
      )
    })

    it(`Fails if 'lastUpdatedAt' is below the min allowed value 'createdAt' value`, function () {
      const createdAt = new Date()

      // @ts-expect-error Purposely exclude properties or set to
      // disallowed TypeScript values for testing schema validation
      const baseSaraObject = {
        id: 'someValidId',
        createdAt,
        lastUpdatedAt: +createdAt - 1,
      } as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.exist
      expect(validationError?.message).to.exist
      expect(validationError?.message).to.equal(
        `"lastUpdatedAt" must be greater than or equal to "ref:createdAt"`,
      )
    })

    it(`Fails if 'lastUpdatedAt' is above the max allowed value`, function () {
      // @ts-expect-error Purposely exclude properties or set to
      // disallowed TypeScript values for testing schema validation
      const baseSaraObject = {
        id: 'someValidId',
        createdAt: new Date(),
        // 01-01-2100
        lastUpdatedAt: 4102473600000,
      } as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.exist
      expect(validationError?.message).to.exist
      expect(validationError?.message).to.equal(
        `"lastUpdatedAt" must be less than or equal to "now"`,
      )
    })

    it(`Passes validation`, function () {
      const baseSaraObject = {
        id: 'someValidId',
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      } as BaseSaraObject

      const validationError =
        BaseSaraObjectSchema.validate(baseSaraObject).error

      expect(validationError).to.not.exist
    })
  })

  // 03/29/24: All of these tests were commented out as a result of us refining
  // our data model and iterating on it. A new Goal type was introduced and when
  // we get the time we ought to review if these tests are still valid or use
  // them for reference for building new tests.

  // describe(`'GoalSchema' Validation`, function () {
  //   it(`Fails if 'orgId' is missing`, function () {
  //     const createdAt = new Date()

  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(`"orgId" is required`)
  //   })

  //   it(`Fails if 'orgId' is 'undefined'`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: undefined,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(`"orgId" is required`)
  //   })

  //   it(`Fails if 'orgId' is 'null'`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: null,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(`"orgId" must be a string`)
  //   })

  //   it(`Fails if 'orgId' is the empty string`, function () {
  //     const createdAt = new Date()

  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: '',
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(
  //       `"orgId" is not allowed to be empty`,
  //     )
  //   })

  //   it(`Fails if 'title' is missing`, function () {
  //     const createdAt = new Date()

  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(`"title" is required`)
  //   })

  //   it(`Fails if 'title' is 'undefined'`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: undefined,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(`"title" is required`)
  //   })

  //   it(`Fails if 'title' is 'null'`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: null,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(`"title" must be a string`)
  //   })

  //   it(`Fails if 'title' is the empty string`, function () {
  //     const createdAt = new Date()

  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: '',
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(
  //       `"title" is not allowed to be empty`,
  //     )
  //   })

  //   it(`Fails if 'description' is missing`, function () {
  //     const createdAt = new Date()

  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(`"description" is required`)
  //   })

  //   it(`Fails if 'description' is 'undefined'`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: undefined,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(`"description" is required`)
  //   })

  //   it(`Fails if 'description' is 'null'`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: null,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(
  //       `"description" must be a string`,
  //     )
  //   })

  //   it(`Fails if 'description' is the empty string`, function () {
  //     const createdAt = new Date()

  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: '',
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(
  //       `"description" is not allowed to be empty`,
  //     )
  //   })

  //   it(`Fails if 'status' is 'undefined'`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: undefined,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist

  //     // Check for `parentProjectId` being required as the error since in
  //     // our schema this is the next data member that is defined and
  //     // marked as required
  //     expect(validationError?.message).to.equal(`"parentProjectId" is required`)
  //   })

  //   it(`Fails if 'status' is 'null'`, function () {
  //     const createdAt = new Date()

  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: null,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(`"status" must be a string`)
  //   })

  //   it(`Fails if 'status' is the empty string`, function () {
  //     const createdAt = new Date()

  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: '',
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(
  //       `"status" is not allowed to be empty`,
  //     )
  //   })

  //   it(`Fails if 'chatId' is 'undefined'`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: undefined,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist

  //     // Check for `parentProjectId` being required as the error since in
  //     // our schema this is the next data member that is defined and
  //     // marked as required
  //     expect(validationError?.message).to.equal(`"parentProjectId" is required`)
  //   })

  //   it(`Fails if 'chatId' is 'null'`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: null,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(`"chatId" must be a string`)
  //   })

  //   it(`Fails if 'chatId' is the empty string`, function () {
  //     const createdAt = new Date()

  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: '',
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(
  //       `"chatId" is not allowed to be empty`,
  //     )
  //   })

  //   it(`Fails if 'parentProjectId' is missing`, function () {
  //     const createdAt = new Date()

  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: 'someValidId',
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(`"parentProjectId" is required`)
  //   })

  //   it(`Fails if 'parentProjectId' is 'undefined'`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: 'someValidId',
  //       parentProjectId: undefined,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(`"parentProjectId" is required`)
  //   })

  //   it(`Fails if 'parentProjectId' is 'null'`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: 'someValidId',
  //       parentProjectId: null,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(
  //       `"parentProjectId" must be a string`,
  //     )
  //   })

  //   it(`Fails if 'parentProjectId' is the empty string`, function () {
  //     const createdAt = new Date()

  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: 'someValidId',
  //       parentProjectId: '',
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(
  //       `"parentProjectId" is not allowed to be empty`,
  //     )
  //   })

  //   it(`Fails if 'taskIds' is 'undefined'`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: 'someValidId',
  //       parentProjectId: 'someValidId',
  //       taskIds: undefined,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     // In our schema any of the data members that come after `taskIds`
  //     // aren't required so verify that there are no more errors
  //     expect(validationError).to.not.exist
  //   })

  //   it(`Fails if 'taskIds' is 'null'`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: 'someValidId',
  //       parentProjectId: 'someValidId',
  //       taskIds: null,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(`"taskIds" must be an array`)
  //   })

  //   it(`Fails if 'taskIds' isn't an array`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: 'someValidId',
  //       parentProjectId: 'someValidId',
  //       taskIds: 'clearlyNotAnArray',
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(`"taskIds" must be an array`)
  //   })

  //   it(`Fails if 'taskIds' doesn't contain strings`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: 'someValidId',
  //       parentProjectId: 'someValidId',
  //       taskIds: [123],
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(`"taskIds[0]" must be a string`)
  //   })

  //   it(`Fails if 'closedAt' is 'undefined'`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: 'someValidId',
  //       parentProjectId: 'someValidId',
  //       taskIds: ['someValidId'],
  //       closedAt: undefined,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     // In our schema any of the data members that come after `taskIds`
  //     // aren't required so verify that there are no more errors
  //     expect(validationError).to.not.exist
  //   })

  //   it(`Fails if 'closedAt' is 'null'`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: 'someValidId',
  //       parentProjectId: 'someValidId',
  //       taskIds: ['someValidId'],
  //       closedAt: null,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(
  //       `"closedAt" must be a valid date`,
  //     )
  //   })

  //   it(`Fails if 'closedAt' isn't a date`, function () {
  //     const createdAt = new Date()

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt: createdAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: 'someValidId',
  //       parentProjectId: 'someValidId',
  //       taskIds: ['someValidId'],
  //       closedAt: 'clearlyNotADate',
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(
  //       `"closedAt" must be in timestamp or number of milliseconds format`,
  //     )
  //   })

  //   it(`Fails if 'closedAt' is below the min allowed value 'lastUpdatedAt' value`, function () {
  //     const createdAt = +new Date() - 100
  //     const lastUpdatedAt = +createdAt + 10
  //     const closedAt = +lastUpdatedAt - 5

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: 'someValidId',
  //       parentProjectId: 'someValidId',
  //       taskIds: ['someValidId'],
  //       closedAt,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(
  //       `"closedAt" must be greater than or equal to "ref:lastUpdatedAt"`,
  //     )
  //   })

  //   it(`Fails if 'closedAt' is above the max allowed value`, function () {
  //     const createdAt = +new Date() - 100
  //     const lastUpdatedAt = +createdAt + 10

  //     // @ts-expect-error Purposely exclude properties or set to
  //     // disallowed TypeScript values for testing schema validation
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt,
  //       lastUpdatedAt,
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: 'someValidId',
  //       parentProjectId: 'someValidId',
  //       taskIds: ['someValidId'],
  //       // 01-01-2100
  //       closedAt: 4102473600000,
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.exist
  //     expect(validationError?.message).to.exist
  //     expect(validationError?.message).to.equal(
  //       `"closedAt" must be less than or equal to "now"`,
  //     )
  //   })

  //   it(`Passes validation`, function () {
  //     const goal = {
  //       id: 'someValidId',
  //       createdAt: new Date(),
  //       lastUpdatedAt: new Date(),
  //       orgId: 'someValidId',
  //       title: 'someTitle',
  //       description: 'someDescription',
  //       status: 'someStatus',
  //       chatId: 'someValidId',
  //       parentProjectId: 'someValidId',
  //       taskIds: ['someValidId'],
  //       closedAt: new Date(),
  //     } as Goal

  //     const validationError = GoalSchema.validate(goal).error

  //     expect(validationError).to.not.exist
  //   })
  // })
})
