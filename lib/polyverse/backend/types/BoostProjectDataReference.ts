
export interface ProjectDataReference extends Record<string, any> {
    name: string
    type: string
    id: string
    lastUpdatedAt: Date // renamed from backend: lastUpdated
  }
  