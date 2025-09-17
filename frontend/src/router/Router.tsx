import { useState, useEffect } from 'react'
import Onboarding from '../pages/Onboarding'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import ClubSelection from '../pages/ClubSelection'
import ClubCreation from '../pages/ClubCreation'
import ClubList from '../pages/ClubList'
import ClubDashboard from '../pages/ClubDashboard'
import Notification from '../pages/Notification'
import MtPlanner from '../pages/MtPlanner'
import MyPage from '../pages/MyPage'

type Route = 'onboarding' | 'login' | 'signup' | 'club-selection' | 'club-creation' | 'club-list' | 'club-dashboard' | 'notification' | 'mt-planner' | 'my-page'

const Router = () => {
  const [currentRoute, setCurrentRoute] = useState<Route>(() => {
    const path = window.location.pathname
    if (path === '/login') return 'login'
    if (path === '/signup') return 'signup'
    if (path === '/club-selection') return 'club-selection'
    if (path === '/club-creation') return 'club-creation'
    if (path === '/club-list') return 'club-list'
    if (path === '/club-dashboard') return 'club-dashboard'
    if (path === '/notification') return 'notification'
    if (path === '/mt-planner') return 'mt-planner'
    if (path === '/my-page') return 'my-page'
    return 'onboarding'
  })

  const navigate = (route: Route) => {
    setCurrentRoute(route)
    const path = route === 'onboarding' ? '/' : `/${route}`
    window.history.pushState({}, '', path)
  }

  useEffect(() => {
    const handlePopstate = () => {
      const path = window.location.pathname
      if (path === '/login') setCurrentRoute('login')
      else if (path === '/signup') setCurrentRoute('signup')
      else if (path === '/club-selection') setCurrentRoute('club-selection')
      else if (path === '/club-creation') setCurrentRoute('club-creation')
      else if (path === '/club-list') setCurrentRoute('club-list')
      else if (path === '/club-dashboard') setCurrentRoute('club-dashboard')
      else if (path === '/notification') setCurrentRoute('notification')
      else if (path === '/mt-planner') setCurrentRoute('mt-planner')
      else if (path === '/my-page') setCurrentRoute('my-page')
      else setCurrentRoute('onboarding')
    }

    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
  }, [])

  switch (currentRoute) {
    case 'login':
      return <Login
        onNavigateToOnboarding={() => navigate('onboarding')}
        onNavigateToSignup={() => navigate('signup')}
        currentRoute={currentRoute}
      />
    case 'signup':
      return <Signup
        onNavigateToOnboarding={() => navigate('onboarding')}
        onNavigateToLogin={() => navigate('login')}
        currentRoute={currentRoute}
      />
    case 'club-selection':
      return <ClubSelection
        onNavigateToOnboarding={() => navigate('onboarding')}
        onNavigateToJoinClub={() => navigate('club-list')}
        onNavigateToCreateClub={() => navigate('club-creation')}
        currentRoute={currentRoute}
      />
    case 'club-creation':
      return <ClubCreation
        onNavigateToOnboarding={() => navigate('onboarding')}
        onNavigateToClubSelection={() => navigate('club-selection')}
        onCreateClub={(clubData) => console.log('Club created:', clubData)}
        currentRoute={currentRoute}
      />
    case 'club-list':
      return <ClubList
        onNavigateToOnboarding={() => navigate('onboarding')}
        onNavigateToClubDashboard={() => navigate('club-dashboard')}
        currentRoute={currentRoute}
      />
    case 'club-dashboard':
      return <ClubDashboard
        onNavigateToOnboarding={() => navigate('onboarding')}
        currentRoute={currentRoute}
      />
    case 'notification':
      return <Notification
        onNavigateToOnboarding={() => navigate('onboarding')}
      />
    case 'mt-planner':
      return <MtPlanner
        onNavigateToOnboarding={() => navigate('onboarding')}
      />
    case 'my-page':
      return <MyPage
        onNavigateToOnboarding={() => navigate('onboarding')}
      />
    default:
      return <Onboarding onNavigateToLogin={() => navigate('login')} />
  }
}

export default Router