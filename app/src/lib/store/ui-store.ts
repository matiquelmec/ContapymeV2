import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebar: (open: boolean) => void
  
  dashboardYear: number
  setDashboardYear: (year: number) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebar: (open) => set({ sidebarOpen: open }),
      
      dashboardYear: new Date().getFullYear(),
      setDashboardYear: (year) => set({ dashboardYear: year }),
    }),
    {
      name: 'contapymepuq-ui-storage',
    }
  )
)
