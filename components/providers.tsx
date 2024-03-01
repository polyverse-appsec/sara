'use client'

import * as React from 'react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'

import { SidebarProvider } from './..//lib/hooks/use-sidebar'
import { AppProvider } from './../lib/hooks/app-context'
import { TooltipProvider } from './ui/tooltip'

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <SessionProvider>
        {/* New SessionProvider added here */}
        <AppProvider>
          {' '}
          {/* New AppProvider added here */}
          <SidebarProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </SidebarProvider>
        </AppProvider>
      </SessionProvider>
    </NextThemesProvider>
  )
}
