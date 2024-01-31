import * as chaiImport from 'chai'

import { createChat } from '../../app/actions'

import { nanoid } from 'nanoid'

describe('Actions - Chat', function() {
    it(`Should successfully create a Chat`, async function() {
        const expectedChatID = nanoid();
        const expectedUserID = nanoid();

        const expectedChat = {
            id: expectedChatID,
            title: 'Some Title',
            userId: expectedUserID,
            createdAt: Date.now(),
            path: `/chat/${expectedChatID}`,
            messages: []
        }

        const actualChat = await createChat()
    })
})