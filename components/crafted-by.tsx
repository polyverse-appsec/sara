import React from 'react'

import { cn } from '../lib/utils'
import { ExternalLink } from './external-link'

export function CraftedBy({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <span
      className={cn(
        'px-2 text-center text-xs leading-normal text-muted-foreground',
        className,
      )}
      {...props}
    >
      Crafted with ❤️ by{' '}
      <ExternalLink href="https://polyverse.com">
        {' '}
        the Polyverse team
      </ExternalLink>{' '}
      and Sara herself!
    </span>
  )
}
