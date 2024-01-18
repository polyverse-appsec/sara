'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/lib/hooks/app-context'
import { GlobalContextWatcher } from './global-context-watcher'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <SessionProvider>
        {/* New SessionProvider added here */}
        <AppProvider>
          {' '}
          {/* New AppProvider added here */}
          <GlobalContextWatcher>
            <SidebarProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </SidebarProvider>
          </GlobalContextWatcher>
        </AppProvider>
      </SessionProvider>
    </NextThemesProvider>
  )
}
