'use client'

import '@radix-ui/themes/styles.css'

import { Flex, Theme } from '@radix-ui/themes'

import HeaderCallouts from './../../components/callouts/header-callouts'
import SidebarNav from './../../components/sidebar-nav'
import { isPreviewFeatureEnabled } from 'lib/utils'
import SaraLoading from 'components/sara-loading'

interface NavigatableLayoutProps {
  children: React.ReactNode
}

const NavigatableLayout = ({ children }: NavigatableLayoutProps) => {
  const isMaintenanceMode = isPreviewFeatureEnabled('EmergencyMaintenanceMode', '')

  return (
    <Theme>
      <Flex direction="column" height="h-screen">
        <HeaderCallouts />
        <div className="flex flex-1 overflow-hidden">
          {isMaintenanceMode ? (
            <SaraLoading message="Sara is currently undergoing maintenance. Please check back later." />
          ) : (
            <>
              <SidebarNav />
              <div className="flex-1 overflow-auto">{children}</div>
            </>
          )}
        </div>
      </Flex>
    </Theme>
  )
}

export default NavigatableLayout
