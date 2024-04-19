'use client'

import '@radix-ui/themes/styles.css'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  const [calloutHeight, setCalloutHeight] = useState(0)
  const isProduction =
    process.env.NEXT_PUBLIC_SARA_STAGE?.toLowerCase() === 'prod'

  useEffect(() => {
    if (!saraSession) {
      return
    }

    if (isProduction) {
      setCalloutHeight(60)
    } else {
      setCalloutHeight(100)
    }
  }, [saraSession, isProduction])

  if (!saraSession) {
    return null
  }

  const waitlistEnabled = isPreviewFeatureEnabled('WaitlistNewCustomers')

  if (waitlistEnabled && true === saraSession?.waitlisted) {
    const waitlistMessage = `Sara appreciates your interest!  She is currently at her maximum capacity for new users.  Your email (${saraSession.email}) has been automatically added to the waitlist.  We will let you know as soon as she has capacity. Please contact sales@polyverse.com for any questions.`

    return (
      <Theme>
        <Flex direction="column" style={{ minHeight: '100vh', width: '100vw' }}>
          <HeaderCallouts />
          <Flex className="flex flex-1 overflow-auto" style={{ width: '100%' }}>
            <Link
              href="mailto:sales@polyverse.com"
              className="block transition hover:scale-105"
              style={{ width: '100%' }}
            >
              <SaraLoading message={waitlistMessage} />
            </Link>
          </Flex>
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
              <div
                className="flex-1 overflow-auto"
                style={{ marginLeft: '240px', marginTop: `${calloutHeight}px` }}
              >
                {children}
              </div>
            </>
          )}
        </div>
      </Flex>
    </Theme>
  )
}

export default NavigatableLayout
