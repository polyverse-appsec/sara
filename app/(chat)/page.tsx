import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'

export default function IndexPage() {
  const id = nanoid()
  //TODO what chat is this?  This is going to break us until we implement a 'user chat' with no
  //repo selected.
  const chat = {
    id: id,
    title: 'Chat',
    userId: '1',
    messages: [],
    createdAt: new Date(),
    path: `/chat/${id}`
  }

  return <Chat chat={chat} />
}
