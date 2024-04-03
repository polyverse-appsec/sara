'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import { Button } from './../../../../../components/ui/button'
import { type GitHubOrg, type Org } from './../../../../../lib/data-model-types'
import { useAppContext } from './../../../../../lib/hooks/app-context'
import BusinessBillingContextCreator from './business-billing-context-creator'
import LoadingSpinner from 'components/loading-spinner'
import { SaraSession } from 'auth'
import { useSession } from 'next-auth/react'
import { getGitHubOrgs } from 'app/react-utils'
import Link from 'next/link'
import { Flex } from '@radix-ui/themes'
import { ArrowLeftIcon } from '@radix-ui/react-icons'

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

  const [personalBillingExists, setPersonalBillingExists] = useState<boolean>(false)
  const [selectedBusinessBilling, setSelectedBusinessBilling] = useState<boolean>(false)
  const [shouldShowLoadingSpinner, setShouldShowLoadingSpinner] =
    useState<boolean>(true)

  const [fetchedGitHubOrgs, setFetchedGitHubOrgs] = useState<GitHubOrg[]>([])

  const handleUnselectBillingOrganization = () => {
    setSelectedBusinessBilling(false);
  };

  useEffect(() => {
    const fetchOrgs = async () => {
      if (!saraSession?.username) {
        return
      }

      try {
        const fetchedBillingOrgs = await getBillingOrgs()

        const personalBillingExists = fetchedBillingOrgs.some(org => org.name === saraSession.username);

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
                    Back to Orgs
                    </Flex>
                </Link>
              </button>
            </div>
            <p>
              Create an organization that will be billed. When a billing
              organization is set as the active billingcontext all future
              resources created will be associated with it. For example
              projects, goals, tasks, and chats.
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
                  <div className="text-2xl font-bold">
                    Personal
                  </div>
              </Button>
              {personalBillingExists && 
                <div className="text-md text-red-500 font-bold mt-5">Personal Already Created</div>
              }
            </div>
            <div className="flex flex-col items-center">
              <Button 
                className="mx-5 rounded-lg bg-blue-500 hover:bg-blue-700 h-64 w-64"
                onClick={() => setSelectedBusinessBilling(true)}
                disabled={fetchedGitHubOrgs.length === 0}
                >
                  <div className="text-2xl font-bold">
                    Business
                  </div>
              </Button>
              {(fetchedGitHubOrgs.length === 0) && 
                <div className="text-md text-red-500 font-bold mt-5">No Github Orgs</div>
              }
            </div>
          </div>
        </div>

      )}
      {selectedBusinessBilling && <BusinessBillingContextCreator onUnselectBillingOrganization={handleUnselectBillingOrganization} />}
    </div>
  )
}

export default OrgCreate
