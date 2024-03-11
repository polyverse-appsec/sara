import { Chat } from './../../../components/chat'
import { Header } from './../../../components/header'
import { nanoid } from './../../../lib/utils'

export default function ChatIndexPage() {
  const id = nanoid()
  //TODO what chat is this?  This is going to break us until we implement a 'user chat' with no
  //repo selected.
  const chat = {
    id: id,
    title: 'Chat',
    userId: '1',
    messages: [],
    createdAt: new Date(),
    path: `/chat/${id}`,
  }

  return (
    <>
      <Header />
      <Chat chat={chat} />
    </>
  )
}
