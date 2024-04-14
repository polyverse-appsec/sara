'use client'

import '@radix-ui/themes/styles.css'

import { Flex, Theme } from '@radix-ui/themes'
import { useEffect } from 'react'

import HeaderCallouts from './../../components/callouts/header-callouts'
import SidebarNav from './../../components/sidebar-nav'
import { isPreviewFeatureEnabled } from 'lib/utils'
import SaraLoading from 'components/sara-loading'
import { SaraSession } from 'auth'
import { useSession } from 'next-auth/react'

interface NavigatableLayoutProps {
  children: React.ReactNode
}

const NavigatableLayout = ({ children }: NavigatableLayoutProps) => {
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  useEffect(() => {

    if (!saraSession) {
        return
    }
  }, [saraSession])

  if (!saraSession) {
    return null
  }

  const isMaintenanceMode = isPreviewFeatureEnabled('EmergencyMaintenanceMode', saraSession.email)

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
