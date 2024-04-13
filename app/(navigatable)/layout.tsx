'use client'

import '@radix-ui/themes/styles.css'

import { Flex, Theme } from '@radix-ui/themes'

import FeedbackHeader from './../../components/callouts/feedback-callout'
import SidebarNav from './../../components/sidebar-nav'

interface NavigatableLayoutProps {
  children: React.ReactNode
}

const NavigatableLayout = ({ children }: NavigatableLayoutProps) => {
  return (
    <>
      <Theme>
        <Flex direction="column" height="h-screen">
          <FeedbackHeader />
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
