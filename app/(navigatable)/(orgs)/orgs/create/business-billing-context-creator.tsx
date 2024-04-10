'use client'

import React, { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { Callout, Flex, Link } from '@radix-ui/themes'
import OauthExplanation from 'components/oauth-explanation'
import toast from 'react-hot-toast'

import { Button } from './../../../../../components/ui/button'
import { type GitHubOrg, type Org } from './../../../../../lib/data-model-types'
import { useAppContext } from './../../../../../lib/hooks/app-context'
import OrgSelector from './github-org-selector'

const BusinessBillingContextCreator = ({
  onUnselectBillingOrganization,
}: {
  onUnselectBillingOrganization: () => void
}) => {
  const router = useRouter()
  const { setActiveBillingOrg } = useAppContext()

  const [saveButtonEnabled, setSaveButtonEnabled] = useState<boolean>(true)
  const [controlledGitHubOrg, setControlledGitHubOrg] =
    useState<GitHubOrg | null>(null)

  return (
    <div className="flex-1 flex-col p-10">
      <div className="bg-background shadow-md rounded-lg p-6">
        <button
          className="btn-blue text-sm"
          onClick={(e) => {
            e.preventDefault()
            onUnselectBillingOrganization()
          }}
        >
          <Flex align="center">
            <ArrowLeftIcon className="mr-2" />
            Back
          </Flex>
        </button>
        <div className="grid grid-cols-1 gap-4">
          <div className="text-base my-1">
            <h3 className="text-lg font-semibold">
              Select Business Billing Account Context
            </h3>
            <p>
              Select the organization or company that will be billed for your
              Sara analysis.
            </p>
            <p>
              You may also be able to share Project analysis, Sara resources,
              Goals and Tasks across members of your organization.
            </p>
          </div>
          <div className="my-1">
            <OrgSelector
              setControlledGitHubOrg={(gitHubOrg) =>
                setControlledGitHubOrg(gitHubOrg)
              }
            />
          </div>
          <div className="my-1">
            <Button
              variant="ghost"
              onClick={async (e) => {
                e.preventDefault()

                setSaveButtonEnabled(false)

                if (!controlledGitHubOrg) {
                  toast.error(
                    `Please select a GitHub organization - if none are available contact support`,
                  )
                  setSaveButtonEnabled(true)
                  return
                }

                try {
                  const orgBody = { name: controlledGitHubOrg.login }

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
                      `Failed to create a billing context because: ${errText}`,
                    )

                    toast.error(`Failed to create billing context`)

                    setSaveButtonEnabled(true)
                    return
                  }

                  const org = (await res.json()) as Org

                  setActiveBillingOrg(org)

                  router.push(`/orgs/${org.id}`)
                } catch (err) {
                  console.debug(
                    `Caught error when trying to create a billing context: ${err}`,
                  )

                  setSaveButtonEnabled(true)

                  toast.error(`Failed to create billing context`)
                }
              }}
            >
              {saveButtonEnabled ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  className="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
              )}
              {saveButtonEnabled ? 'Save' : 'Saving'}
            </Button>
          </div>
        </div>
        <Callout.Root color="orange">
          <Callout.Icon>
            <OauthExplanation />
          </Callout.Icon>
          <Callout.Text>
            If your orgs do not appear in the business billing section,
            configure Sara OAuth settings{' '}
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
    </div>
  )
}

export default BusinessBillingContextCreator
