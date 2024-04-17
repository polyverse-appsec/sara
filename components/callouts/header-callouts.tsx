'use client'

import { Flex } from '@radix-ui/themes'
import { useSession } from 'next-auth/react'

import { type SaraSession } from './../../auth'
import DeploymentStageCallout from './deployment-header'
import ExperimentalCallout from './experimental-header'
import FeedbackCallout from './feedback-callout'

const HeaderCallouts = () => {
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const isProduction = process.env.SARA_STAGE?.toLowerCase() === 'prod'

  // DeploymentStageCallout only appears when not in production
  const deploymentStageClassname = 'top-0 w-full h-[32px]'

  // ExperimentalCallout appears below the DeploymentStageCallout if it is rendered
  const experimentalClassname = isProduction
    ? 'top-0 w-full h-[32px]'
    : 'top-32 w-full h-[32px]'

  // FeedbackCallout position and height depend on whether saraSession exists
  const feedbackClassname = saraSession
    ? 'top-32 w-full h-[40px]'
    : 'top-32 w-full h-[32px]'

  // Callouts as headers need to be sticky so they stay in position as the
  // user scrolls.
  return (
    <div className="sticky z-50">
      <Flex direction="column">
        {!isProduction && (
          <div className={deploymentStageClassname}>
            <DeploymentStageCallout />
          </div>
        )}
        <div className={experimentalClassname}>
          <ExperimentalCallout />
        </div>
        <div className={feedbackClassname}>
          <FeedbackCallout />
        </div>
      </Flex>
    </div>
  )
}

export default HeaderCallouts
