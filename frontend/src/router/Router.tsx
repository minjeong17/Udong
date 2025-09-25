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
import MyPage from '../pages/MyPage'
import Shop from '../pages/Shop'
import MemberManagement from '../pages/MemberManagement'
import PaymentManagement from '../pages/PaymentManagement'
import ClubFund from '../pages/ClubFund'
import { RouterContext, type Route } from '../hooks/useRouter'
import { useAuthStore } from '../stores/authStore'


const Router = () => {
  const { isAuthenticated } = useAuthStore()

  // 공개 페이지 (인증 없이 접근 가능)
  const publicRoutes: Route[] = ['onboarding', 'login', 'signup']

  // 경로를 라우트로 변환하는 함수
  const getRouteFromPath = (path: string): Route => {
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
    if (path === '/mypage') return 'mypage'
    if (path === '/shop') return 'shop'
    if (path === '/member-management') return 'member-management'
    if (path === '/payment-management') return 'payment-management'
    if (path === '/club-fund') return 'club-fund'
    return 'onboarding'
  }

  const [currentRoute, setCurrentRoute] = useState<Route>(() => {
    const path = window.location.pathname
    const requestedRoute = getRouteFromPath(path)

    // 인증이 필요한 페이지인지 확인
    if (!publicRoutes.includes(requestedRoute) && !isAuthenticated) {
      // 인증되지 않은 사용자가 보호된 페이지에 접근하려고 하면 로그인으로 리다이렉트
      window.history.pushState({}, '', '/login')
      return 'login'
    }

    return requestedRoute
  })

  const navigate = (route: Route) => {
    // 인증이 필요한 페이지인지 확인
    if (!publicRoutes.includes(route) && !isAuthenticated) {
      // 인증되지 않은 사용자가 보호된 페이지로 이동하려고 하면 로그인으로 리다이렉트
      setCurrentRoute('login')
      window.history.pushState({}, '', '/login')
      return
    }

    setCurrentRoute(route)
    const path = route === 'onboarding' ? '/' : `/${route}`
    window.history.pushState({}, '', path)
  }

  // 브라우저 뒤로가기/앞으로가기 처리
  useEffect(() => {
    const handlePopstate = () => {
      const path = window.location.pathname
      const requestedRoute = getRouteFromPath(path)

      // 인증이 필요한 페이지인지 확인
      if (!publicRoutes.includes(requestedRoute) && !isAuthenticated) {
        // 인증되지 않은 사용자가 보호된 페이지에 접근하려고 하면 로그인으로 리다이렉트
        setCurrentRoute('login')
        window.history.pushState({}, '', '/login')
        return
      }

      setCurrentRoute(requestedRoute)
    }

    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
  }, [isAuthenticated])

  // 인증 상태 변경 시 현재 페이지가 보호된 페이지인지 확인
  useEffect(() => {
    if (!publicRoutes.includes(currentRoute) && !isAuthenticated) {
      // 로그아웃되었는데 보호된 페이지에 있다면 로그인으로 리다이렉트
      setCurrentRoute('login')
      window.history.pushState({}, '', '/login')
    }
  }, [isAuthenticated, currentRoute])

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
    case 'mypage':
      return <MyPage
        onNavigateToOnboarding={() => navigate('onboarding')}
      />
    case 'shop':
      return <Shop
        onNavigateToOnboarding={() => navigate('onboarding')}
      />
    case 'member-management':
      return <MemberManagement
        onNavigateToOnboarding={() => navigate('onboarding')}
        currentRoute={currentRoute}
      />
    case 'payment-management':
      return <PaymentManagement
        onNavigateToOnboarding={() => navigate('onboarding')}
        currentRoute={currentRoute}
      />
    case 'club-fund':
      return <ClubFund
        onNavigateToOnboarding={() => navigate('onboarding')}
        currentRoute={currentRoute}
      />
    default:
      return <Onboarding
        onNavigateToLogin={() => navigate('login')}
        onNavigateToClubSelection={() => navigate('club-selection')}
      />
    }
  }

  return (
    <RouterContext.Provider value={routerValue}>
      {renderPage()}
    </RouterContext.Provider>
  )
}

export default Router