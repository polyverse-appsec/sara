'use client'

import { Sidebar } from './sidebar'
import { Button } from './ui/button'
import { IconSidebar } from './ui/icons'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'

interface SidebarMobileProps {
  children: React.ReactNode
}

export function SidebarMobile({ children }: SidebarMobileProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="-ml-2 flex h-9 w-9 p-0 lg:hidden">
          <IconSidebar className="h-6 w-6" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="inset-y-0 flex h-auto w-[300px] flex-col p-0">
        <Sidebar className="flex">{children}</Sidebar>
      </SheetContent>
    </Sheet>
  )
}
