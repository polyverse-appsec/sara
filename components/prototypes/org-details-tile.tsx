'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface OrgDetailsTileProps {
  login: string
  avatar_url: string
}

export const OrgDetailsTile = ({ login, avatar_url }: OrgDetailsTileProps) => {
  // TODO: What should the slug in the URI be for our ORG?
  return (
    <Link
      href={`/orgs/${login}`}
      className="block transform transition hover:scale-105"
    >
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold">{login}</h3>
        <Image
          className="w-6 h-6 transition-opacity duration-300 rounded-full select-none ring-1 ring-zinc-100/10 hover:opacity-80"
          src={avatar_url}
          alt={'Org Avatar'}
          height={48}
          width={48}
        />
      </div>
    </Link>
  )
}
