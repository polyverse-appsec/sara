'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useAppContext } from 'lib/hooks/app-context'

import SaraPortrait from './../../public/Sara_Cartoon_Portrait.png'

const SidebarNav = () => {
  const {
    prototypeContext: { activeOrg },
  } = useAppContext()

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
      </div>
      <div className="flex justify-center px-2 py-1 text-base font-medium rounded-lg">
        <p className="text-center">Active Organization:</p>
      </div>
      <div className="flex justify-center px-2 py-1 text-base font-medium rounded-lg">
        <p>{activeOrg ? activeOrg.login : 'None'}</p>
      </div>
      {/* Buttons section */}
      <nav className="flex flex-col space-y-1">
        {/* Organizations Button */}
        <button
          className="flex items-center px-2 py-1 text-base font-medium rounded-lg hover:bg-secondary"
          style={{
            color: 'var(--secondary-foreground)',
            backgroundColor: 'var(--secondary)',
            borderWidth: '1px',
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius)',
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
              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
            />
          </svg>
          <span className="ml-3">Organizations</span>
        </button>

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
    </motion.aside>
  )
}

export default SidebarNav
