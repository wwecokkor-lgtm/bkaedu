import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { UserRole } from './types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 1. Check if logged in
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check if profile exists (ensures we have role data)
  if (!userProfile) {
    return <div className="text-center p-10">প্রোফাইল লোড হচ্ছে...</div>;
  }

  // 3. Check for specific roles (e.g. Admin Only)
  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-red-100 text-red-600 p-4 rounded-full mb-4">
          <i className="fas fa-lock text-3xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">অ্যাক্সেস ডিনাইড (Access Denied)</h2>
        <p className="text-gray-600 mb-6 max-w-md">
          আপনার এই পেজটি দেখার অনুমতি নেই। আপনি যদি মনে করেন এটি ভুল, তবে প্রশাসকের সাথে যোগাযোগ করুন।
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;