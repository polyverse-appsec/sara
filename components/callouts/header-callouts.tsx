'use client'

import { Flex } from '@radix-ui/themes'
import { useSession } from 'next-auth/react'

import { type SaraSession } from './../../auth'
import ExperimentalCallout from './experimental-header'
import FeedbackCallout from './feedback-callout'

const HeaderCallouts = () => {
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  // This is cumbersome logic but will suffice for now. The <FeedbackCallout>
  // grows in size as a result of the session data being present from 48px to
  // 64 px. Adjust the height dynamically as a result.
  const feedbackClassname = saraSession
    ? 'top-0 w-full h-[64px]'
    : 'top-0 w-full h-[48px]'

  const experimentalClassname = saraSession
    ? 'top-64 w-full h-[48px]'
    : 'top-48 w-full h-[48px]'

  // Callouts as headers need to be sticky so they stay in position as the
  // user scrolls.
  //
  // Give each callout the largest rendered height that you observe in the DOM
  // explorer of the developers console.
  //
  // Position each in in the top of the view port based on the sum height of
  // all of the callouts that were rendered before them.
  return (
    <div className="sticky z-50">
      <Flex direction="column">
        <div className={feedbackClassname}>
          <FeedbackCallout />
        </div>
        <div className={experimentalClassname}>
          <ExperimentalCallout />
        </div>
      </Flex>
    </div>
  )

  //     <div className="sticky top-0 w-full z-50 h-[64px]">
  //     <Callout.Root color="green">
  //       <Callout.Text>
  //         <Flex as="span" align="center" gap="4">
  //           <ChatBubbleIcon />
  //           {renderHeaderText(saraSession)}
  //           <FeedbackDialog saraSession={saraSession} />
  //         </Flex>
  //       </Callout.Text>
  //     </Callout.Root>
  //   </div>
}

export default HeaderCallouts
