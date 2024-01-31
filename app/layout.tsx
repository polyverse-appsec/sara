import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { Toaster } from 'react-hot-toast'

// Import 'global.css' to apply styling rules to all of our components in all of
// our routes
import './globals.css'

import { Header } from './../components/header'
import { Providers } from './../components/providers'
import { TailwindIndicator } from './../components/tailwind-indicator'
import { cn } from './../lib/utils'

export const metadata = {
  metadataBase: new URL(`https://${process.env.NEXTAUTH_URL}`),
  title: {
    default: 'Polyverse Boost: Sara AI',
    template: `%s - Polyverse Boost: Sara AI`,
  },
  description:
    "Hi, I'm Sara, a smart architectural reasoning assistant powered by AI. I understand your entire software project and can help you build and maintain it faster.",
  icons: {
    icon: '/Sara_Cartoon_Portrait.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

interface RootLayoutProps {
  children: React.ReactNode
}

// In NextJS layouts are shared UI between multiple pages. On navigation,
// layouts preserve state, remain interactive, and do not re-render. Layouts
// can also be nested.
//
// In this files/component case this is our root layout which will be shared
// across all of our pages.
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'font-sans antialiased',
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <Toaster />
        <Providers
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            {/* @ts-ignore */}
            <Header />
            <main className="flex flex-col flex-1 bg-muted/50">{children}</main>
          </div>
          <TailwindIndicator />
        </Providers>
      </body>
    </html>
  )
}
