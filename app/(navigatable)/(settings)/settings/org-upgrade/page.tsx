'use client'

import { OrgDetailsTile } from "app/(navigatable)/(orgs)/orgs/org-details-tile"
import RenderableResourceContent from "components/renderable-resource/renderable-resource-content"
import { useAppContext } from "lib/hooks/app-context"
import { useEffect, useState } from "react"

const SettingsOrgUpgrade = () => {
    const { activeBillingOrg} = useAppContext()
    const [orgs, setOrgs] = useState([])

    useEffect(() => {
      ;(async () => {
        const res = await fetch('/api/orgs')
  
        if (!res.ok) {
          const errText = await res.text()
  
          throw new Error(
            `Failed to get a success response when fetching organizations because: ${errText}`,
          )
        }
  
        const fetchedOrgs = await res.json()
  
        setOrgs(fetchedOrgs)
      })()
    }, [])

    return (
        <div className="flex flex-col items-center p-10">
          <p className="text-2xl font-bold">Upgrade Your Org to Premium</p>
          <div className="w-1/2 border-t-2 border-blue-600 my-2"></div>
          { activeBillingOrg ? <p className="m-4">Your current billing org is {activeBillingOrg.name} </p> : 'No selected billing org' }
          <RenderableResourceContent>
            <p>Choose an org to Upgrade to Premium</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orgs.map(({ name, id }) => (
                <OrgDetailsTile key={id} name={name} id={id} />
                ))}
            </div>
            <p className="mt-4">Once you select an org to upgrade, you will be redirected to it's page where you can proceed with upgrading it</p>
            <p className="mt-2">If you do not see your org here, you need to add it in the manage organizations settings page</p>
          </RenderableResourceContent>
        </div>

    )  

}

export default SettingsOrgUpgrade