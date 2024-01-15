'use client'

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect
} from 'react'
import { User, Organization, Project, Task, Chat } from '@/lib/dataModelTypes'
import { useSession } from 'next-auth/react'
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
    null
  )
  const [selectedActiveChat, setSelectedActiveChat] = useState<Chat | null>(
    null
  )
  const [tasksLastGeneratedAt, setTasksLastGeneratedAt] = useState<
    number | null
  >(null)

  const value = {
    user,
    setUser,
    selectedOrganization,
    setSelectedOrganization,
    selectedProject: selectedProject,
    setSelectedProject: setSelectedProject,
    selectedActiveTask,
    setSelectedActiveTask,
    selectedActiveChat,
    setSelectedActiveChat,
    tasksLastGeneratedAt,
    setTasksLastGeneratedAt
  }

  const { data: session } = useSession()

  useEffect(() => {
    const fetchUser = async () => {
      console.log('AppProvider: session: ', session)
      if (session) {
        try {
          const user = await getOrCreateUserFromSession(session)
          console.log('AppProvider: user: ', user)
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
