'use client'

import '@radix-ui/themes/styles.css'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Flex, Theme } from '@radix-ui/themes'
import { SaraSession } from 'auth'
import SaraLoading from 'components/sara-loading'
import { isPreviewFeatureEnabled } from 'lib/service-utils'
import { useSession } from 'next-auth/react'

import HeaderCallouts from './../../components/callouts/header-callouts'
import SidebarNav from './../../components/sidebar-nav'

interface NavigatableLayoutProps {
  children: React.ReactNode
}

const NavigatableLayout = ({ children }: NavigatableLayoutProps) => {
  const router = useRouter()
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

  const waitlistEnabled = isPreviewFeatureEnabled('WaitlistNewCustomers')

  if (waitlistEnabled && true === saraSession?.waitlisted) {

    const waitlistMessage =
      `Sara appreciates your interest! She is currently at her maximum capacity for new users. You have been automatically added to the waitlist (${saraSession.email}). We will let you know as soon as she has capacity. Please contact sales@polyverse.com for any questions.`

    return (
        <Theme>
          <Flex direction="column" height="h-screen">
            <HeaderCallouts />
            <div className="flex flex-1 overflow-hidden">
                <SaraLoading message={waitlistMessage} />
            </div>
          </Flex>
        </Theme>
      )
    }

  const isMaintenanceMode = isPreviewFeatureEnabled(
    'EmergencyMaintenanceMode',
    saraSession.email,
  )

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
