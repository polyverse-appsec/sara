'use client'

import { Flex } from '@radix-ui/themes'
import { useSession } from 'next-auth/react'

import { type SaraSession } from './../../auth'
import DeploymentStageCallout from './deployment-header'
import ExperimentalCallout from './experimental-header'
import FeedbackCallout from './feedback-callout'

const deploymentCalloutHeight = 32
const experimentalCalloutHeight = 32
const feedbackCalloutHeight = 40
const feedbackCalloutHeightWithoutButton = 32
const calloutGap = 8

export const headerCalloutsHeight_Production =
    (experimentalCalloutHeight + calloutGap) +
    (feedbackCalloutHeight + calloutGap)

export const headerCalloutsHeight_NonProduction =
    (deploymentCalloutHeight) +
    (experimentalCalloutHeight) +
    (feedbackCalloutHeight)

const HeaderCallouts = () => {
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const isProduction =
    process.env.NEXT_PUBLIC_SARA_STAGE?.toLowerCase() === 'prod'

  // DeploymentStageCallout only appears when not in production
  const deploymentStageClassname = `top-0 w-full h-[${deploymentCalloutHeight}px]`

  // ExperimentalCallout appears below the DeploymentStageCallout if it is rendered
  const experimentalClassname = isProduction
    ? `top-0 w-full h-[${experimentalCalloutHeight}px]`
    : `top-${deploymentCalloutHeight + calloutGap} w-full h-[${experimentalCalloutHeight}px]`

  // FeedbackCallout position and height depend on whether saraSession exists
  const feedbackClassname = saraSession
    ? `top-${experimentalCalloutHeight + calloutGap} w-full h-[${feedbackCalloutHeight}px]`
    : `top-${experimentalCalloutHeight + calloutGap} w-full h-[${feedbackCalloutHeightWithoutButton}px]`

  // Callouts as headers need to be sticky so they stay in position as the
  // user scrolls.
  return (
    <div className="fixed w-full z-50 pb-2 bg-background">
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
