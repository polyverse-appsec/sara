'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { SidebarProvider } from '@/lib/hooks/use-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/lib/hooks/app-context'
import { GlobalContextWatcher } from './global_context_watcher'

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <AppProvider>
        {' '}
        {/* New AppProvider added here */}
        <GlobalContextWatcher>
          <SidebarProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </SidebarProvider>
        </GlobalContextWatcher>
      </AppProvider>
    </NextThemesProvider>
  )
}
