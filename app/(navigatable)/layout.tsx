'use client'

import '@radix-ui/themes/styles.css'

import { Theme } from '@radix-ui/themes'

import SidebarNav from './../../components/sidebar-nav'

interface NavigatableLayoutProps {
  children: React.ReactNode
}

const NavigatableLayout = ({ children }: NavigatableLayoutProps) => {
  return (
    <>
      <Theme>
        <div className="w-[250px] fixed h-full overflow-y-auto z-50">
          <SidebarNav />
        </div>
        <div className="flex-1 ml-[250px] overflow-auto">{children}</div>
      </Theme>
    </>
  )
}

export default NavigatableLayout
