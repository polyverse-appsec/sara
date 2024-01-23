import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/auth'

import { Button, buttonVariants } from '@/components/ui/button'
import { IconNextChat, IconSeparator } from '@/components/ui/icons'
import { UserMenu } from '@/components/user-menu'

import Sara32x32 from '../public/Sara_Cartoon_Portrait-32x32.png'
import BoostLogo from '../public/boostlogo.png'
import { ChatHistory } from './chat-history'
import { GithubPanel } from './github-panel'
import { SidebarMobile } from './sidebar-mobile'
import { SidebarToggle } from './sidebar-toggle'

async function UserOrLogin() {
  const session = await auth()
  //BUGBUG (alexgo)--the mobile version needs to use the real activeTask.
  return (
    <>
      {session?.user ? (
        <>
          <SidebarMobile>
            <ChatHistory task={null} />
          </SidebarMobile>
          <SidebarToggle />
        </>
      ) : (
        <Link href="/" target="_self" rel="nofollow">
          <Image src={Sara32x32} alt="Sara Architecture Assistant" />
        </Link>
      )}
      <div className="flex items-center">
        {session?.user ? (
          <>
            <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
            <UserMenu user={session.user} />
          </>
        ) : null}
        {session?.user ? <GithubPanel /> : null}
      </div>
    </>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <UserOrLogin />
        </React.Suspense>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Image
          src={BoostLogo} // Adjust the path to your boost.jpg
          alt="Boost"
          width={100} // Adjust the width as needed
          height={50} // Adjust the height as needed
        />
      </div>
    </header>
  )
}
