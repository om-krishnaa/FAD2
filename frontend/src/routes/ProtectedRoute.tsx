import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: JSX.Element;
  checkAuth: () => boolean;
  redirectPath: string;
}

const ProtectedRoute = ({
  children,
  checkAuth,
  redirectPath,
}: ProtectedRouteProps) => {
  const { isAuthLoading } = useAuth();

  if (isAuthLoading) return null;

  return checkAuth() ? children : <Navigate to={redirectPath} replace />;
};

export default ProtectedRoute;
