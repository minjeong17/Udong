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
import Settlement from '../pages/Settlement'
import Chat from '../pages/Chat'
import Vote from '../pages/Vote'
import Calendar from '../pages/Calendar'
import { RouterContext, type Route } from '../hooks/useRouter'


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
    if (path === '/settlement') return 'settlement'
    if (path === '/chat') return 'chat'
    if (path === '/vote') return 'vote'
    if (path === '/calendar') return 'calendar'
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
      else if (path === '/settlement') setCurrentRoute('settlement')
      else if (path === '/chat') setCurrentRoute('chat')
      else if (path === '/vote') setCurrentRoute('vote')
      else if (path === '/calendar') setCurrentRoute('calendar')
      else setCurrentRoute('onboarding')
    }

    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
  }, [])

  const routerValue = {
    currentRoute,
    navigate
  }

  const renderPage = () => {
    switch (currentRoute) {
    case 'login':
      return <Login
        onNavigateToOnboarding={() => navigate('onboarding')}
        onNavigateToSignup={() => navigate('signup')}
        onNavigateToClubSelection={() => navigate('club-selection')}
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
        onNavigateToClubSelection={() => navigate('club-selection')}
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
    case 'settlement':
      return <Settlement
        onNavigateToOnboarding={() => navigate('onboarding')}
      />
    case 'chat':
      return <Chat
        onNavigateToOnboarding={() => navigate('onboarding')}
      />
    case 'vote':
      return <Vote
        onNavigateToOnboarding={() => navigate('onboarding')}
      />
    case 'calendar':
      return <Calendar
        onNavigateToOnboarding={() => navigate('onboarding')}
      />
    default:
      return <Onboarding onNavigateToLogin={() => navigate('login')} />
    }
  }

  return (
    <RouterContext.Provider value={routerValue}>
      {renderPage()}
    </RouterContext.Provider>
  )
}

export default Router