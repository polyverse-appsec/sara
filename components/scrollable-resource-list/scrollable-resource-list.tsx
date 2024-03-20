'use client'

import * as ScrollArea from '@radix-ui/react-scroll-area'

interface ScrollableResourceListProps {
  children: React.ReactNode
}

const ScrollableResourceList = ({ children }: ScrollableResourceListProps) => {
  return (
    <ScrollArea.Root className="h-32 overflow-auto">
      <ScrollArea.Viewport>{children}</ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical" />
    </ScrollArea.Root>
  )
}

export default ScrollableResourceList
