'use client'

interface RenderableResourceProps {
  children: React.ReactNode
}

const RenderableResource = ({ children }: RenderableResourceProps) => {
  return <div className="flex-1 flex-col p-10">{children}</div>
}

export default RenderableResource
