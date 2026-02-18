import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const BottomNav = () => {
  const location = useLocation();
  const { userProfile } = useAuth();
  const currentPath = location.pathname;

  const NavItem = ({ to, icon, label, isActive }: { to: string, icon: string, label: string, isActive: boolean }) => (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
    >
      <div className={`relative px-3 py-1 rounded-full transition-all duration-300 ${isActive ? 'bg-blue-50' : ''}`}>
        <i className={`fas ${icon} text-lg ${isActive ? 'transform scale-110' : ''}`}></i>
      </div>
      <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{label}</span>
    </Link>
  );

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 h-16 safe-area-bottom">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        <NavItem 
          to="/" 
          icon="fa-home" 
          label="হোম" 
          isActive={currentPath === '/'} 
        />
        <NavItem 
          to="/courses" 
          icon="fa-book-open" 
          label="কোর্স" 
          isActive={currentPath.startsWith('/courses') || currentPath.startsWith('/course/')} 
        />
        <div className="relative -top-5">
          <Link 
            to="/exams" 
            className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full shadow-lg shadow-blue-500/30 text-white transform transition-transform hover:scale-105 active:scale-95 border-4 border-gray-50"
          >
            <i className="fas fa-clipboard-list text-xl"></i>
          </Link>
        </div>
        <NavItem 
          to="/news" 
          icon="fa-bell" 
          label="নোটিশ" 
          isActive={currentPath.startsWith('/news')} 
        />
        <NavItem 
          to={userProfile ? "/profile" : "/login"} 
          icon={userProfile ? "fa-user-circle" : "fa-sign-in-alt"} 
          label={userProfile ? "প্রোফাইল" : "লগইন"} 
          isActive={currentPath === '/profile' || currentPath === '/login'} 
        />
      </div>
    </div>
  );
};

export default BottomNav;