'use client'

import React from 'react'
import Link from 'next/link'

interface OrgDetailsTileProps {
  name: string
  id: string
}

export const OrgDetailsTile = ({ name, id }: OrgDetailsTileProps) => {
  return (
    <Link
      href={`/orgs/${id}`}
      className="block transform transition hover:scale-105"
    >
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-center text-xs font-medium uppercase rounded-full select-none h-7 w-7 shrink-0 bg-muted/50 text-muted-foreground">
          {name.slice(0, 2)}
        </div>
        <h3 className="text-lg font-semibold">{name}</h3>
      </div>
    </Link>
  )
}
