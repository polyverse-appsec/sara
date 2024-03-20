'use client'

import * as ScrollArea from '@radix-ui/react-scroll-area'

const ScrollableResourceList = () => {
  return (
    <ScrollArea.Root>
      <ScrollArea.Viewport>
        <div>Resource 1</div>
        <div>Resource 2</div>
      </ScrollArea.Viewport>
    </ScrollArea.Root>
  )
}

export default ScrollableResourceList
