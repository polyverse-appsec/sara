'use client'

import '@radix-ui/themes/styles.css'

import { Flex, Theme } from '@radix-ui/themes'

import HeaderCallouts from './../../components/callouts/header-callouts'
import SidebarNav from './../../components/sidebar-nav'

interface NavigatableLayoutProps {
  children: React.ReactNode
}

const NavigatableLayout = ({ children }: NavigatableLayoutProps) => {
  return (
    <>
      <Theme>
        <Flex direction="column" height="h-screen">
          <HeaderCallouts />
          <div className="flex flex-1 overflow-hidden">
            <SidebarNav />
            <div className="flex-1 overflow-auto">{children}</div>
          </div>
        </Flex>
      </Theme>
    </>
  )
}

export default NavigatableLayout
