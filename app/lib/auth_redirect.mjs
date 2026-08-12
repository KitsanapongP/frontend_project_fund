export const getLoginRedirect = ({ isLoggingOut = false, currentPath = '/' } = {}) => {
  if (isLoggingOut) {
    return '/login';
  }

  return `/login?next=${encodeURIComponent(currentPath || '/')}`;
};
