'use server'

import { revalidatePath } from 'next/cache'
import { kv } from '@vercel/kv'

import { auth } from './../../auth'

export async function removeChat({
  id,
  taskId,
  path,
}: {
  id: string
  taskId: string
  path: string
}) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized',
    }
  }

  let uid = await kv.hget<string>(`chat:${id}`, 'userId')

  // Hmmm... This is strange. We ask back from Redis the user ID as a string but
  // the auth conditional below will repeatedly fail as we are using an absolute
  // truthy statement and UID happens to be a `number` instead of a `string` at
  // runtime. I looked at it appears that when we preserve this `userId` it is
  // as a string but maybe Redis doesn't preserve types? Or maybe a chat was
  // created earlier in prototyping phase before launch as a `number`? Anyways
  // we convert a string and this behavior is something to look for in the
  // future.
  if (typeof uid === 'number') {
    uid = '' + uid
  }

  if (uid !== session?.user?.id) {
    return {
      error: 'Unauthorized',
    }
  }

  await kv.del(`chat:${id}`)
  await kv.zrem(`task:chats:${taskId}`, `chat:${id}`)

  // TODO: Why are we revalidating here?
  revalidatePath('/')
  return revalidatePath(path)
}
