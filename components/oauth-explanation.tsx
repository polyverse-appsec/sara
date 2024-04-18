'use client'

import Image from 'next/image'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import { Card, HoverCard } from '@radix-ui/themes'

import OauthImage from './../public/OauthImage.png'

const OauthExplanation = () => {
  return (
    <div className="p-1">
      <HoverCard.Root>
        <HoverCard.Trigger>
          <InfoCircledIcon />
        </HoverCard.Trigger>
        <HoverCard.Content>
          <div className="flex flex-col p-2 bg-background rounded-lg border border-black">
            <div className="flex flex-col items-center">
              <p className="mb-2 font-semibold">Sara Oauth Tip</p>
              <p>There are 3 kinds of permission states for orgs</p>
              <Image
                src={OauthImage}
                alt="oauth image"
                height={200}
                className="rounded-lg"
              />
            </div>
            <div className="flex flex-col align-start">
              <p>
                🟢 The green checkmarked orgs means Sara can read those orgs
              </p>
              <p>✖️ The X marked orgs means Sara cannot read those orgs</p>
              <p className="ml-4">
                - orgs with the &quot;Request&quot; button mean that you need to
                request the org owner to grant sara permission to read the org
              </p>
              <p className="ml-4">
                - orgs with the &quot;Grant&quot; button mean that you are the
                org owner and can grant sara permission to read the org
              </p>
            </div>
          </div>
        </HoverCard.Content>
      </HoverCard.Root>
    </div>
  )
}

export default OauthExplanation
