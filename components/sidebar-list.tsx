import { clearChats, getChats } from '@/app/actions'
import { ClearHistory } from '@/components/clear-history'
import { SidebarItems } from '@/components/sidebar-items'
import { ThemeToggle } from '@/components/theme-toggle'
import { cache } from 'react'

interface SidebarListProps {
  userId?: string
  children?: React.ReactNode
}

const loadChats = cache(async (userId?: string) => {
  return await getChats(userId)
})

// TODO: Is this a React Server Component? It is using async/await without the use of useEffect/useState or data fetching libraries
// Is this because SidebarList is an async component? It allows us to use await to fetch the data
// TODO: Will my componets work if they are client compnoent? Or do I need to create a higher order componet that is server side - changing the boundaries - and then pass the data to my client components
export async function SidebarList({ userId }: SidebarListProps) {
  console.log(`<SidebarList> render before loadChats`)
  const chats = await loadChats(userId)
  console.log(`<SidebarList> render after loadChats`)

  console.log(`Fetched chats length: ${JSON.stringify(chats?.length)}`)

  if (chats?.length > 0) {
    console.log(`Fetched chat[0]: ${JSON.stringify(chats[0])}`)
  }


  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        {chats?.length ? (
          <div className="space-y-2 px-2">
            <SidebarItems chats={chats} />
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No chat history</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between p-4">
        <ThemeToggle />
        <ClearHistory clearChats={clearChats} isEnabled={chats?.length > 0} />
      </div>
    </div>
  )
}
