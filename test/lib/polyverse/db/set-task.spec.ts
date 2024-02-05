import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import Joi from 'joi'

import { kv } from '@vercel/kv'


import { type Task } from './../../../../lib/data-model-types'
import { taskKey } from './../../../../lib/polyverse/db/keys'
import setTask from './../../../../lib/polyverse/db/set-task'
import { nanoid } from './../../../../lib/utils'

use(chaiAsPromised)

describe(`Redis DB - 'setTask'`, function () {
    describe(`Schema Validation`, function () {
        it(`Fails if 'id' is missing`, function() {
            const task = {} as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"id" is required`,
                ),
            ])
        })

        it(`Fails if 'id' is 'null'`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: null,
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"id" must be a string`,
                ),
            ])
        })

        it(`Fails if 'id' is the empty string`, function() {
            const task = {
                id: ``,
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"id" is not allowed to be empty`,
                ),
            ])
        })

        it(`Fails if 'title' is missing`, function() {
            const task = {
                id: `someId`
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"title" is required`,
                ),
            ])
        })

        it(`Fails if 'title' is 'null'`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: `someId`,
                title: null,
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"title" must be a string`,
                ),
            ])
        })

        it(`Fails if 'title' is the empty string`, function() {
            const task = {
                id: `someId`,
                title: ``,
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"title" is not allowed to be empty`,
                ),
            ])
        })

        it(`Fails if 'description' is missing`, function() {
            const task = {
                id: `someId`,
                title: `someTitle`
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"description" is required`,
                ),
            ])
        })

        it(`Fails if 'description' is 'null'`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: null
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"description" must be a string`,
                ),
            ])
        })

        it(`Fails if 'description' is the empty string`, function() {
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: ``
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"description" is not allowed to be empty`,
                ),
            ])
        })

        it(`Fails if 'createdAt' is missing`, function() {
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"createdAt" is required`,
                ),
            ])
        })

        it(`Fails if 'createdAt' isn't a date`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
                createdAt: `clearlyNotADate`
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"createdAt" must be in timestamp or number of milliseconds format`,
                ),
            ])
        })

        it(`Fails if 'createdAt' is below the min allowed value`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
                // 01-01-2023
                createdAt: 1672560000000
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"createdAt" must be greater than or equal to "2023-12-25T00:00:00.000Z"`,
                ),
            ])
        })

        it(`Fails if 'createdAt' is above the max allowed value`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
                // 01-01-2100
                createdAt: 4102473600000
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"createdAt" must be less than or equal to "now"`,
                ),
            ])
        })

        it(`Fails if 'userId' is missing`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
                createdAt: Date.now(),
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"userId" is required`,
                ),
            ])
        })

        it(`Fails if 'userId' is 'null'`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
                createdAt: Date.now(),
                userId: null
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"userId" must be a string`,
                ),
            ])
        })

        it(`Fails if 'userId' is the empty string`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
                createdAt: Date.now(),
                userId: ``
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"userId" is not allowed to be empty`,
                ),
            ])
        })

        it(`Fails if 'projectId' is missing`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
                createdAt: Date.now(),
                userId: `someUserId`
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"projectId" is required`,
                ),
            ])
        })

        it(`Fails if 'projectId' is 'null'`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
                createdAt: Date.now(),
                userId: `someUserId`,
                projectId: null
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"projectId" must be a string`,
                ),
            ])
        })

        it(`Fails if 'projectId' is the empty string`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
                createdAt: Date.now(),
                userId: `someUserId`,
                projectId: ``
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"projectId" is not allowed to be empty`,
                ),
            ])
        })

        it(`Fails if 'chat' is 'null'`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
                createdAt: Date.now(),
                userId: `someUserId`,
                projectId: `someProjectId`,
                chats: null
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"chats" must be an array`,
                ),
            ])
        })

        it(`Fails if 'chat' isn't an array`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
                createdAt: Date.now(),
                userId: `someUserId`,
                projectId: `someProjectId`,
                chats: {}
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"chats" must be an array`,
                ),
            ])
        })

        it(`Fails if 'subtasks' is 'null'`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
                createdAt: Date.now(),
                userId: `someUserId`,
                projectId: `someProjectId`,
                chats: [],
                subtasks: null
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"subtasks" must be an array`,
                ),
            ])
        })

        it(`Fails if 'subtasks' isn't an array`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
                createdAt: Date.now(),
                userId: `someUserId`,
                projectId: `someProjectId`,
                chats: [],
                subtasks: {}
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"subtasks" must be an array`,
                ),
            ])
        })

        it(`Fails if 'subtasks' doesn't contain shapes in the form of a 'Task'`, function() {
            // @ts-expect-error Purposely exclude properties or set to
            // disallowed TypeScript values for testing schema validation
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
                createdAt: Date.now(),
                userId: `someUserId`,
                projectId: `someProjectId`,
                chats: [],
                subtasks: [ { im: 'not in the shape of a task'} ]
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"subtasks[0].id" is required`,
                ),
            ])
        })

        it(`Fails if extra properties on task`, function() {
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
                createdAt: new Date(),
                userId: `someUserId`,
                projectId: `someProjectId`,
                imAnExtraProperty: `Im an extra property value`
            } as Task

            const promise = setTask(task)

            return Promise.all([
                expect(promise).to.be.rejectedWith(Joi.ValidationError),
                expect(promise).to.be.rejectedWith(
                  `"imAnExtraProperty" is not allowed`,
                ),
            ])
        })

        it(`Passes validation`, function() {
            const task = {
                id: `someId`,
                title: `someTitle`,
                description: `someDescription`,
                createdAt: new Date(),
                userId: `someUserId`,
                projectId: `someProjectId`,
                // TODO: Expand on this by filling in `chats` and `subtasks`
            } as Task

            const promise = setTask(task)

            return expect(promise).to.be.fulfilled
        })
    })

    describe(`Business logic`, function() {
        it(`Successfully writes to DB`, async function() {
            const expectedTask = {
                id: nanoid(),
                title: `someTitle`,
                description: `someDescription`,
                createdAt: new Date(),
                userId: `someUserId`,
                projectId: `someProjectId`,
            } as Task

            // For correctness start by verifying there is nothing written to
            // the DB yet for where we would expect the task to be written
            // @ts-ignore Ignoring template strings shenanigans: https://github.com/microsoft/TypeScript/issues/33304
            const expectedTaskKey = taskKey`${expectedTask.id}`
            const nonExistantTask = await kv.hgetall<Task>(expectedTaskKey)

            expect(nonExistantTask).to.be.null

            await setTask(expectedTask)

            const actualTask = await kv.hgetall<Task>(expectedTaskKey)

            expect(actualTask).to.be.not.null

            // We check that `createdAt` isn't `null` and then convert it to an
            // instance of the `Date` type as when it is queried from Redis it
            // is returned as a string. This way we can still do an equality
            // check on it.
            expect(actualTask?.createdAt).to.not.be.null
            actualTask!.createdAt = new Date(actualTask!.createdAt)

            expect(actualTask).to.deep.equal(expectedTask)
        })
    })
})
