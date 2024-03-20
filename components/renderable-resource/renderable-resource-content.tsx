'use client'

interface RenderableResourceContentProps {
  children: React.ReactNode
}

const RenderableResourceContent = ({
  children,
}: RenderableResourceContentProps) => {
  return (
    <div className="bg-background shadow-md rounded-lg p-6 border mb-4">
      {children}
    </div>
  )
}

export default RenderableResourceContent
