'use client'

import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { UserMenu } from 'components/user-menu'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

import { useAppContext } from './../lib/hooks/app-context'
import SaraPortrait from './../public/Sara_Cartoon_Portrait.png'
import NavResourceLoader from './nav-resource-tree/nav-resource-loader'

const SidebarNav = () => {
  const router = useRouter()
  const { user, activeBillingOrg, projectIdForConfiguration } = useAppContext()

  return (
    <motion.aside
      className="absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out"
      initial={{ width: 0 }}
      animate={{ width: 250 }}
      exit={{ width: 0 }}
      transition={{ type: 'spring', bounce: 0 }}
      style={{
        backgroundColor: 'var(--primary)',
        color: 'var(--primary-foreground)',
        paddingTop: '1.75rem', // py-7
        paddingLeft: '0.5rem', // px-2
        paddingRight: '0.5rem', // px-2
        width: '16rem', // w-64
      }}
    >
      {/* Logo section */}
      <div className="flex flex-col items-center p-4 ">
        <Image
          src={SaraPortrait} // Adjust the path to your image
          alt="Sara's Portrait"
          width={100} // Adjust the width as needed
          height={100} // Adjust the height as needed
        />
        <UserMenu user={user} />
      </div>
      <div className="flex justify-center px-2 py-1 text-base font-medium rounded-lg">
        <p>{activeBillingOrg ? activeBillingOrg.name : 'No org selected'}</p>
      </div>
      {/* Buttons section */}
      <nav className="flex flex-col space-y-1">
        {/* Projects Button */}
        <button
          className="flex items-center px-2 py-1 text-base font-medium rounded-lg hover:bg-secondary"
          style={{
            color: 'var(--secondary-foreground)',
            backgroundColor: 'var(--secondary)',
            borderWidth: '1px',
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius)',
          }}
          onClick={(event) => {
            event.preventDefault()

            if (!activeBillingOrg) {
              toast.error(`Please select billing organization`)
              return
            }

            router.push('/projects')
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
            />
          </svg>
          <span className="ml-3">Projects</span>
        </button>
      </nav>
      {projectIdForConfiguration ? (
        <NavResourceLoader projectId={projectIdForConfiguration} />
      ) : null}
    </motion.aside>
  )
}

export default SidebarNav
