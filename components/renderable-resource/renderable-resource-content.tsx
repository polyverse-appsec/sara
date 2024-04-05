'use client'

interface RenderableResourceContentProps {
  children: React.ReactNode
}

const RenderableResourceContent = ({
  children,
}: RenderableResourceContentProps) => {
  return (
    <div className="bg-background shadow-md rounded-lg p-6 mb-4 blue-border">
      {children}
    </div>
  )
}

export default RenderableResourceContent
