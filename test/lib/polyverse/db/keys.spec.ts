import { expect } from 'chai'

import { projectUserFileInfoIdsSetKey, taskKey, userTasksKey } from './../../../../lib/polyverse/db/keys'

describe(`Redis Keys`, function () {
  describe(`projectUserFileInfoIdsSetKey tag`, function () {
    it(`Throws an 'Error' if 'projectName' is 'undefined'`, function () {
      // @ts-expect-error Purposely exclude arguments for testing
      expect(() => projectUserFileInfoIdsSetKey``).to.throw(
        Error,
        `'projectName' not allowed to be blank (undefined, null, or the empty string)`,
      )
    })

    it(`Throws an 'Error' if 'projectName' is 'null'`, function () {
      // @ts-expect-error Purposely exclude arguments for testing
      expect(() => projectUserFileInfoIdsSetKey`${null}`).to.throw(
        Error,
        `'projectName' not allowed to be blank (undefined, null, or the empty string)`,
      )
    })

    it(`Throws an 'Error' if 'projectName' is the empty string`, function () {
      // @ts-expect-error Purposely exclude arguments for testing
      expect(() => projectUserFileInfoIdsSetKey`${''}`).to.throw(
        Error,
        `'projectName' not allowed to be blank (undefined, null, or the empty string)`,
      )
    })

    it(`Throws an 'Error' if 'userId' is 'undefined'`, function () {
      const someProjectName = `someProjectName`

      // @ts-expect-error Purposely exclude arguments for testing
      expect(() => projectUserFileInfoIdsSetKey`${someProjectName}`).to.throw(
        Error,
        `'userId' not allowed to be blank (undefined, null, or the empty string)`,
      )
    })

    it(`Throws an 'Error' if 'userId' is 'null'`, function () {
      const someProjectName = `someProjectName`

      // @ts-expect-error Purposely exclude arguments for testing
      expect(() => projectUserFileInfoIdsSetKey`${someProjectName}${null}`).to.throw(
        Error,
        `'userId' not allowed to be blank (undefined, null, or the empty string)`,
      )
    })

    it(`Throws an 'Error' if 'userId' is the empty string`, function () {
      const someProjectName = `someProjectName`

      // @ts-expect-error Purposely exclude arguments for testing
      expect(() => projectUserFileInfoIdsSetKey`${someProjectName}${''}`).to.throw(
        Error,
        `'userId' not allowed to be blank (undefined, null, or the empty string)`,
      )
    })

    it(`Generates the expected key`, function () {
      const someProjectName = `someProjectName`
      const someUserId = `someUserId`

      const expectedKey = `project:${someProjectName}:user:${someUserId}:fileInfoIds`

      // @ts-expect-error We don't use the string literals
      expect(projectUserFileInfoIdsSetKey`${someProjectName}${someUserId}`).to.be.string(
        expectedKey,
      )
    })
  })

  describe(`taskKey tag`, function () {
    it(`Throws an 'Error' if 'taskId' is 'undefined'`, function () {
      // @ts-expect-error Purposely exclude arguments for testing
      expect(() => taskKey``).to.throw(
        Error,
        `'taskId' not allowed to be blank (undefined, null, or the empty string)`,
      )
    })

    it(`Throws an 'Error' if 'taskId' is 'null'`, function () {
      // @ts-expect-error Purposely exclude arguments for testing
      expect(() => taskKey`${null}`).to.throw(
        Error,
        `'taskId' not allowed to be blank (undefined, null, or the empty string)`,
      )
    })

    it(`Throws an 'Error' if 'taskId' is the empty string`, function () {
      // @ts-expect-error Purposely exclude arguments for testing
      expect(() => taskKey`${''}`).to.throw(
        Error,
        `'taskId' not allowed to be blank (undefined, null, or the empty string)`,
      )
    })

    it(`Generates the expected key`, function () {
      const someTaskId = `someTaskId`

      const expectedKey = `task:${someTaskId}`

      // @ts-expect-error We don't use the string literals
      expect(taskKey`${someTaskId}`).to.be.string(expectedKey)
    })
  })

  describe(`userTasksKey tag`, function () {
    it(`Throws an 'Error' if 'userId' is 'undefined'`, function () {
      // @ts-expect-error Purposely exclude arguments for testing
      expect(() => userTasksKey``).to.throw(
        Error,
        `'userId' not allowed to be blank (undefined, null, or the empty string)`,
      )
    })

    it(`Throws an 'Error' if 'userId' is 'null'`, function () {
      // @ts-expect-error Purposely exclude arguments for testing
      expect(() => userTasksKey`${null}`).to.throw(
        Error,
        `'userId' not allowed to be blank (undefined, null, or the empty string)`,
      )
    })

    it(`Throws an 'Error' if 'userId' is the empty string`, function () {
      // @ts-expect-error Purposely exclude arguments for testing
      expect(() => userTasksKey`${''}`).to.throw(
        Error,
        `'userId' not allowed to be blank (undefined, null, or the empty string)`,
      )
    })

    it(`Throws an 'Error' if 'projectName' is 'undefined'`, function () {
      const someUserId = `someUserId`

      // @ts-expect-error Purposely exclude arguments for testing
      expect(() => userTasksKey`${someUserId}`).to.throw(
        Error,
        `'projectName' not allowed to be blank (undefined, null, or the empty string)`,
      )
    })

    it(`Throws an 'Error' if 'projectName' is 'null'`, function () {
      const someUserId = `someUserId`

      // @ts-expect-error Purposely exclude arguments for testing
      expect(() => userTasksKey`${someUserId}${null}`).to.throw(
        Error,
        `'projectName' not allowed to be blank (undefined, null, or the empty string)`,
      )
    })

    it(`Throws an 'Error' if 'projectName' is the empty string`, function () {
      const someUserId = `someUserId`

      // @ts-expect-error Purposely exclude arguments for testing
      expect(() => userTasksKey`${someUserId}${''}`).to.throw(
        Error,
        `'projectName' not allowed to be blank (undefined, null, or the empty string)`,
      )
    })

    it(`Generates the expected key`, function () {
      const someUserId = `someUserId`
      const someProjectName = `someProjectName`

      const expectedKey = `user:${someUserId}:project:tasks:${someProjectName}`

      // @ts-expect-error We don't use the string literals
      expect(userTasksKey`${someUserId}${someProjectName}`).to.be.string(
        expectedKey,
      )
    })
  })
})
