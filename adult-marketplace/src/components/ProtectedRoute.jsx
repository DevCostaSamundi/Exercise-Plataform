import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, requireCreator = false }) {
  const location = useLocation();

  const authToken = localStorage.getItem('authToken');
  const userStr   = localStorage.getItem('user');

  if (!authToken || !userStr) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  let user = null;
  try {
    user = JSON.parse(userStr);
  } catch {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireCreator) {
    const isCreator =
      user?.role?.toLowerCase() === 'creator' ||
      user?.isCreator === true;

    if (!isCreator) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}