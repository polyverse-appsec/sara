import * as chaiImport from 'chai'
import { nanoid } from 'nanoid'

import { createChat } from '../../app/_actions/create-chat'

describe('Actions - Chat', function () {
  it(`Should successfully create a Chat`, async function () {
    const expectedChatID = nanoid()
    const expectedUserID = nanoid()

    const expectedChat = {
      id: expectedChatID,
      title: 'Some Title',
      userId: expectedUserID,
      createdAt: Date.now(),
      path: `/chat/${expectedChatID}`,
      messages: [],
    }

    const actualChat = await createChat()
  })
})
