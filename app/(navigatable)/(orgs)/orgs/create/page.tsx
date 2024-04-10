'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { Callout, Flex } from '@radix-ui/themes'
import { getGitHubOrgs } from 'app/react-utils'
import { SaraSession } from 'auth'
import LoadingSpinner from 'components/loading-spinner'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

import { Button } from './../../../../../components/ui/button'
import { type GitHubOrg, type Org } from './../../../../../lib/data-model-types'
import { useAppContext } from './../../../../../lib/hooks/app-context'
import BusinessBillingContextCreator from './business-billing-context-creator'
import OauthExplanation from 'components/oauth-explanation'

const getBillingOrgs = async (): Promise<Org[]> => {
  const res = await fetch('/api/orgs')

  if (!res.ok) {
    const errText = await res.text()

    throw new Error(
      `Failed to get a success response when fetching billing context because: ${errText}`,
    )
  }

  return res.json()
}

const OrgCreate = () => {
  const router = useRouter()
  const { setActiveBillingOrg } = useAppContext()
  const session = useSession()
  const saraSession = session.data ? (session.data as SaraSession) : null

  const [saveButtonEnabled, setSaveButtonEnabled] = useState<boolean>(true)
  const [controlledGitHubOrg, setControlledGitHubOrg] =
    useState<GitHubOrg | null>(null)

  const [personalBillingExists, setPersonalBillingExists] =
    useState<boolean>(false)
  const [selectedBusinessBilling, setSelectedBusinessBilling] =
    useState<boolean>(false)
  const [shouldShowLoadingSpinner, setShouldShowLoadingSpinner] =
    useState<boolean>(true)

  const [fetchedGitHubOrgs, setFetchedGitHubOrgs] = useState<GitHubOrg[]>([])

  const handleUnselectBillingOrganization = () => {
    setSelectedBusinessBilling(false)
  }

  useEffect(() => {
    const fetchOrgs = async () => {
      if (!saraSession?.username) {
        return
      }

      try {
        const fetchedBillingOrgs = await getBillingOrgs()

        const personalBillingExists = fetchedBillingOrgs.some(
          (org) => org.name === saraSession.username,
        )

        if (personalBillingExists) {
          setPersonalBillingExists(true)
        }

        const fetchedGitHubOrgs = await getGitHubOrgs()

        setFetchedGitHubOrgs(fetchedGitHubOrgs)
      } catch (error) {
        console.error('Error fetching orgs:', error)
      }
    }

    setShouldShowLoadingSpinner(false)
    fetchOrgs()
  }, [saraSession])

  if (shouldShowLoadingSpinner) {
    return <LoadingSpinner />
  }

  return (
    <div>
      {!selectedBusinessBilling && (
        <div className="flex flex-col items-center">
          <div className="bg-background shadow-md rounded-lg p-6 font-semibold text-base text-center my-2 mx-2">
            <div className="text-left mb-2">
              <button className="btn-blue text-sm">
                <Link href="/orgs">
                  <Flex align="center">
                    <ArrowLeftIcon className="mr-2" />
                    Back to Billing Contexts
                  </Flex>
                </Link>
              </button>
            </div>
            <h3 className="text-lg font-semibold">Select the type of Billing you would like to use.</h3>
            <p>
              A Personal Billing Context is for your personal projects, and typically paid by you. You can only have one Personal Billing Context.
            </p>
            <p>
              A Business Billing Context is for your company or group projects, and typically billed to your company. You can have multiple Business Billing Contexts.
            </p>
          </div>
          <div className="flex justify-content mt-16">
            <div className="flex flex-col items-center">
              <Button
                className="mx-5 rounded-lg bg-blue-500 hover:bg-blue-700 h-64 w-64"
                onClick={async (e) => {
                  e.preventDefault()

                  setSaveButtonEnabled(false)

                  try {
                    const orgBody = { name: saraSession!.username }

                    const res = await fetch('/api/orgs', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(orgBody),
                    })

                    if (!res.ok) {
                      const errText = await res.text()

                      console.debug(
                        `Failed to create personal billing context because: ${errText}`,
                      )

                      toast.error(`Failed to create personal billing context`)
                      setSaveButtonEnabled(true)
                      return
                    }

                    const org = (await res.json()) as Org

                    setActiveBillingOrg(org)

                    router.push(`/orgs/${org.id}`)
                  } catch (err) {
                    console.debug(
                      `Caught error when trying to create a personal billing context: ${err}`,
                    )

                    setSaveButtonEnabled(true)
                    toast.error(`Failed to create personal billing context`)
                  }
                }}
                disabled={personalBillingExists}
              >
                <div className="text-2xl font-bold">Personal</div>
              </Button>
              {personalBillingExists && (
                <div className="text-md text-red-500 font-bold mt-5">
                  Personal Already Created
                </div>
              )}
            </div>
            <div className="flex flex-col items-center">
              <Button
                className="mx-5 rounded-lg bg-blue-500 hover:bg-blue-700 h-64 w-64"
                onClick={() => setSelectedBusinessBilling(true)}
                disabled={fetchedGitHubOrgs.length === 0}
              >
                <div className="text-2xl font-bold">Business</div>
              </Button>
              {fetchedGitHubOrgs.length === 0 && (
                <div className="text-md text-red-500 font-bold mt-5">
                  No Github Orgs
                </div>
              )}
            </div>
          </div>
          <Callout.Root color="orange">
              <Callout.Icon>
                <OauthExplanation />
              </Callout.Icon>
              <Callout.Text>
                If your orgs do not appear in the business billing section, configure Sara OAuth settings{' '}
                <Link
                  href="https://github.com/settings/connections/applications/b2fe85230b8f365e87f8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  here
                </Link>
              </Callout.Text>
            </Callout.Root>
        </div>
      )}
      {selectedBusinessBilling && (
        <BusinessBillingContextCreator
          onUnselectBillingOrganization={handleUnselectBillingOrganization}
        />
      )}
    </div>
  )
}

export default OrgCreate
