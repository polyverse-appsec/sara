'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { ChatBubbleIcon } from '@radix-ui/react-icons'
import * as Label from '@radix-ui/react-label'
import {
  Button,
  Callout,
  Dialog,
  Flex,
  Link,
  Text,
  TextArea,
  TextField,
} from '@radix-ui/themes'
import { useAppContext } from 'lib/hooks/app-context'
import { set } from 'lodash'
import { useSession } from 'next-auth/react'

import { createResourceNoResponseBody } from './../../app/saraClient'
import { type SaraSession } from './../../auth'

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

const FeedbackDialog = ({ saraSession }: FeedbackDialogProps) => {
  const pathname = usePathname()
  const { activeBillingOrg, activeProjectDetails } = useAppContext()

  const [open, setOpen] = useState<boolean>(false)
  const [feedbackTitle, setFeedbackTitle] = useState<string>('')
  const [feedbackDescription, setFeedbackDescription] = useState<string>('')

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
            const reqBody = {
              feedbackTitle,
              feedbackDescription,
              path: pathname,
              activeBillingOrg,
              activeProjectDetails,
            }

            createResourceNoResponseBody(`/feedback`, reqBody)
              .then(() => {
                setOpen(false)
                setFeedbackTitle('')
                setFeedbackDescription('')
              })
              .catch(() => {
                setOpen(false)
                setFeedbackTitle('')
                setFeedbackDescription('')
              })
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
          <Flex direction="column" gap="3">
            <>
              <Label.Root>Title</Label.Root>
              <TextField.Root
                onChange={(e) => setFeedbackTitle(e.target.value)}
              />
            </>
            <>
              <Label.Root>Description</Label.Root>
              <TextArea
                style={{ height: '200px' }}
                onChange={(e) => setFeedbackDescription(e.target.value)}
              />
            </>
            <Flex justify="end" gap="3">
              <Dialog.Close>
                <Button color="gray">Cancel</Button>
              </Dialog.Close>
              <Button type="submit">Submit</Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  )
}

const FeedbackHeader = () => {
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  return (
    <div className="sticky top-0 w-full z-50 h-[64px]">
      <Callout.Root color="green">
        <Callout.Text>
          <Flex as="span" align="center" gap="4">
            <ChatBubbleIcon />
            {renderHeaderText(saraSession)}
            <FeedbackDialog saraSession={saraSession} />
          </Flex>
        </Callout.Text>
      </Callout.Root>
    </div>
  )
}

export default FeedbackHeader
