'use client'

import SidebarNav from './../../components/sidebar-nav'

interface NavigatableLayoutProps {
  children: React.ReactNode
}

const NavigatableLayout = ({ children }: NavigatableLayoutProps) => {
  return (
    <>
      <div className="w-[250px] fixed h-full overflow-y-auto">
        <SidebarNav />
      </div>
      <div className="flex-1 ml-[250px] overflow-auto">{children}</div>
    </>
  )
}

export default NavigatableLayout
