import { createContext, useContext } from 'react'

type Route = 'onboarding' | 'login' | 'signup' | 'club-selection' | 'club-creation' | 'club-list' | 'club-dashboard' | 'notification' | 'mt-planner' | 'settlement' | 'chat' | 'vote' | 'calendar' | 'mypage' | 'shop' | 'member-management'

// Router Context 생성
interface RouterContextType {
  currentRoute: Route
  navigate: (route: Route) => void
}

export const RouterContext = createContext<RouterContextType | null>(null)

export const useRouter = () => {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('useRouter must be used within a Router')
  }
  return context
}

export type { Route, RouterContextType }