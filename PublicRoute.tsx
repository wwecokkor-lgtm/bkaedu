import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PublicRoute = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is already logged in, redirect them to Home (or Profile)
  // 'replace' prevents them from hitting Back to return to the login page
  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  // If not logged in, render the child route (Login/Register)
  return <Outlet />;
};

export default PublicRoute;