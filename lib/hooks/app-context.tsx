'use client'

import React, { createContext, useState, useContext, ReactNode } from 'react'
import { User, Organization, Repository, Task, Chat } from '@/lib/dataModelTypes'

interface AppContextType {
  user: User | null
  setUser: (user: User | null) => void

  selectedOrganization: Organization | null
  setSelectedOrganization: (organization: Organization | null) => void

  selectedRepository: Repository | null
  setSelectedRepository: (repository: Repository | null) => void

  selectedActiveTask: Task | null
  setSelectedActiveTask: (task: Task | null) => void

  selectedActiveChat: Chat | null
  setSelectedActiveChat: (chat: Chat | null) => void

  tasksLastGeneratedAt: number | null
  setTasksLastGeneratedAt: (generatedAt: number | null) => void

}

const AppContext = createContext<AppContextType | null>(null)

export function useAppContext() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useAppContext must be used within a AppProvider')
  }

  return context
}

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null)
  const [selectedRepository, setSelectedRepository] =
    useState<Repository | null>(null)
  const [selectedActiveTask, setSelectedActiveTask] = useState<Task | null>(
    null
  )
  const [selectedActiveChat, setSelectedActiveChat] = useState<Chat | null>(
    null
  )
  const [tasksLastGeneratedAt, setTasksLastGeneratedAt] = useState<number | null>(
    null
  )

  const value = {
    user,
    setUser,
    selectedOrganization,
    setSelectedOrganization,
    selectedRepository,
    setSelectedRepository,
    selectedActiveTask,
    setSelectedActiveTask,
    selectedActiveChat,
    setSelectedActiveChat,
    tasksLastGeneratedAt,
    setTasksLastGeneratedAt
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
