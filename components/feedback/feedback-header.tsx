'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import * as Label from '@radix-ui/react-label'
import { Button, Callout, Dialog, Flex, Link, Text } from '@radix-ui/themes'
import { useAppContext } from 'lib/hooks/app-context'
import { useSession } from 'next-auth/react'

import { type SaraSession } from './../../auth'

// TODO:
// URL
// User ID
// User name
// User email
// If I can't get user email then pivot the UI to show our email address for support then

const renderHeaderText = (saraSession: SaraSession | null) => {
  // If we don't have their session details then just display an email for
  // them to submit a report to
  if (!saraSession) {
    return (
      <Text>
        Sara wants to be useful to you. If you have any feedback, would like to
        request a feature or have identified any bugs please let her know by
        emailing <Link>support@polyverse.com</Link> so she can help you!
      </Text>
    )
  }

  return (
    <Text>
      Sara wants to be useful to you. If you have any feedback, would like to
      request a feature or have identified any bugs please let her know so she
      can help you!
    </Text>
  )
}

interface FeedbackDialogProps {
  saraSession: SaraSession | null
}

const wait = () => new Promise((resolve) => setTimeout(resolve, 5000))

const FeedbackDialog = ({ saraSession }: FeedbackDialogProps) => {
  const [open, setOpen] = useState<boolean>(false)

  // If we don't have their session details then don't provide the ability
  // to click the submit form and hope they email us :fingers-crossed:
  if (!saraSession) {
    return null
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button variant="surface">Leave Feedback</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <form
          onSubmit={(e) => {
            wait().then(() => setOpen(false))
            e.preventDefault()
          }}
        >
          <Dialog.Title>
            Submit Feedback/Request Feature/Bug Report
          </Dialog.Title>
          <Dialog.Description>
            Please provide feedback on how Sara can add more value to you or how
            she can fix a bug in herself. Please be as detailed as you can.
          </Dialog.Description>
          <Flex>
            <Label.Root>Feedback/Feature Request/Bug Report</Label.Root>
          </Flex>
          <Flex justify="end" gap="3">
            <Dialog.Close>
              <Button color="gray">Cancel</Button>
            </Dialog.Close>
            <Button type="submit">Submit</Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  )
}

const FeedbackHeader = () => {
  const pathname = usePathname()
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const { activeBillingOrg, activeProjectDetails } = useAppContext()

  console.log(`***** pathanem: ${pathname}`)
  console.log(`***** saraSession: ${JSON.stringify(saraSession)}`)

  return (
    <div className="sticky top-0 w-full z-50 h-[64px]">
      <Callout.Root color="green">
        <Callout.Text>
          <Flex as="span" align="center" gap="4">
            <InfoCircledIcon />
            {renderHeaderText(saraSession)}
            {/*renderFeedbackDialog(saraSession)*/}
            <FeedbackDialog saraSession={saraSession} />
          </Flex>
        </Callout.Text>
      </Callout.Root>
    </div>
  )
}

export default FeedbackHeader
