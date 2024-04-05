'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

import { Button } from './ui/button'
import { IconMoon, IconSun } from './ui/icons'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [_, startTransition] = React.useTransition()

  return (
    <Button
      size="sm"
      onClick={() => {
        startTransition(() => {
          setTheme(theme === 'light' ? 'dark' : 'light')
        })
      }}
      className="bg-blue-500 hover:bg-blue-700 text-white text-lg p-5"
    >
      <div className="flex items-center">
        <p>Toggle Theme</p>
        {!theme ? (
          theme === 'light'
        ) : theme === 'dark' ? (
          <IconMoon className="transition-all ml-2" />
        ) : (
          <IconSun className="transition-all ml-2" />
        )}
      </div>
    </Button>
  )
}
