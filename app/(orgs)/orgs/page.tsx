'use client'

import { useEffect, useState } from 'react'

import OrgDashboard from './../../../components/prototypes/org-dashboard'

const fetchOrgs = async () => {
  const res = await fetch('/api/orgs')

  if (!res.ok) {
    const errText = await res.text()

    throw new Error(
      `Failed to get a success response when fetching organizations because: ${errText}`,
    )
  }

  return res.json()
}

const OrgIndex = () => {
  // useEffect(() => {
  //   ;(async () => {
  //     const res = await fetch('/api/orgs')
  //     const json = await res.json()

  //     console.log(`***** Response from /api/orgs: ${JSON.stringify(json)}`)
  //   })()
  // })

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
      console.log(`***** fetchedOrgs: ${JSON.stringify(fetchedOrgs)}`)

      setOrgs(fetchedOrgs)
    })()
  }, [])

  // TODO: Loading spinner state if state isn't ready
  return (
    <div className="flex-1 p-10 text-2xl font-bold">
      <OrgDashboard orgs={orgs} />
    </div>
  )
}

export default OrgIndex
