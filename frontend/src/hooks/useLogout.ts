import { useAuthStore } from '../stores/authStore';

export const useLogout = () => {
  const { logout } = useAuthStore();

  const handleLogout = async (onNavigateToOnboarding: () => void) => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      try {
        await logout();
        alert('로그아웃 되었습니다! 👋');
        onNavigateToOnboarding();
      } catch (error) {
        console.error('Logout failed:', error);
        alert('로그아웃에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  return { handleLogout };
};