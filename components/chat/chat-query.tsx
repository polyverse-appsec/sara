'use client'

import { Box, Container, Flex } from '@radix-ui/themes'

import ChatQueryContent from './chat-query-content'
import ChatQueryDetails from './chat-query-details'
import ChatQueryNotes from './chat-query-notes'

{
  /* <Box>
<Container maxWidth="150px">
  <Flex>
    <ChatQueryDetails />
  </Flex>
</Container>
<Container maxWidth="800px">
  <Flex>
    <ChatQueryContent />
  </Flex>
</Container>
<Container maxWidth="200px">
  <Flex>
    <ChatQueryNotes />
  </Flex>
</Container>
</Box> */
}

const ChatQuery = () => {
  return (
    <Flex>
      <Flex direction="column">
        <ChatQueryDetails />
      </Flex>
      <Flex direction="column">
        <ChatQueryContent />
      </Flex>
      <Flex direction="column">
        <ChatQueryNotes />
      </Flex>
    </Flex>
  )
}

export default ChatQuery
