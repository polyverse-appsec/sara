'use client'

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useSession } from 'next-auth/react'

import {
  Chat,
  Organization,
  Project,
  Repository,
  Task,
  User,
} from '@/lib/dataModelTypes'
import { getOrCreateUserFromSession } from '@/app/actions'

interface AppContextType {
  user: User | null
  setUser: (user: User | null) => void

  selectedOrganization: Organization | null
  setSelectedOrganization: (organization: Organization | null) => void

  selectedProject: Project | null
  setSelectedProject: (project: Project | null) => void

  selectedActiveTask: Task | null
  setSelectedActiveTask: (task: Task | null) => void

  selectedActiveChat: Chat | null
  setSelectedActiveChat: (chat: Chat | null) => void

  tasksLastGeneratedAt: number | null
  setTasksLastGeneratedAt: (generatedAt: number | null) => void

  selectedProjectRepositories: Repository[] | null
  setSelectedProjectRepositories: (repositories: Repository[] | null) => void
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedActiveTask, setSelectedActiveTask] = useState<Task | null>(
    null,
  )
  const [selectedActiveChat, setSelectedActiveChat] = useState<Chat | null>(
    null,
  )
  const [tasksLastGeneratedAt, setTasksLastGeneratedAt] = useState<
    number | null
  >(null)
  const [selectedProjectRepositories, setSelectedProjectRepositories] =
    useState<Repository[] | null>(null)

  const value = {
    user,
    setUser,
    selectedOrganization,
    setSelectedOrganization,
    selectedProject,
    setSelectedProject,
    selectedProjectRepositories,
    setSelectedProjectRepositories,
    selectedActiveTask,
    setSelectedActiveTask,
    selectedActiveChat,
    setSelectedActiveChat,
    tasksLastGeneratedAt,
    setTasksLastGeneratedAt,
  }

  const { data: session } = useSession()

  useEffect(() => {
    const fetchUser = async () => {
      if (session) {
        try {
          const user = await getOrCreateUserFromSession(session)
          setUser(user) // Set the user in context
          // You can also set other states here based on the returned user data
        } catch (error) {
          console.error('Error fetching user:', error)
          // Handle errors appropriately
        }
      } else {
        setUser(null) // Reset user in context if session is not available
      }
    }

    fetchUser()
  }, [session])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
