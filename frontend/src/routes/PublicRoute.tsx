import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, isAuthLoading } = useAuth();

  if (isAuthLoading) return null;

  if (user) {
    if (user.role === 'admin' || user.role === 'super_admin') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to={'/user-dashboard'} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
