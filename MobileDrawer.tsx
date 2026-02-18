import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useSite } from './SiteContext'; // Import Site Context
import { UserRole } from './types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { userProfile, logout } = useAuth();
  const { config } = useSite(); // Get config
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate('/login');
  };

  const NavLink = ({ to, icon, label, onClick }: any) => (
    <Link 
      to={to} 
      onClick={onClick || onClose} 
      className="flex items-center space-x-4 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
    >
      <div className="w-8 flex justify-center"><i className={`fas ${icon}`}></i></div>
      <span className="font-semibold">{label}</span>
    </Link>
  );

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div 
        className={`fixed top-0 left-0 w-80 h-full bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
           <div className="flex items-center">
             {config?.logos.mobile || config?.logos.desktop ? (
               <img src={config.logos.mobile || config.logos.desktop} alt={config.siteName} className="h-8 w-auto mr-2" />
             ) : (
               <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-2">
                 {config?.siteName.charAt(0) || 'B'}
               </div>
             )}
             <span className="font-bold text-lg text-gray-800">{config?.siteName || 'BK Academy'}</span>
           </div>
           <button onClick={onClose} className="text-gray-500 hover:text-red-500 focus:outline-none">
             <i className="fas fa-times text-xl"></i>
           </button>
        </div>

        {/* User Info (if logged in) */}
        {userProfile ? (
          <div className="p-5 bg-blue-600 text-white">
            <div className="flex items-center space-x-3 mb-3">
              <img 
                src={userProfile.photoURL || 'https://via.placeholder.com/150'} 
                className="h-12 w-12 rounded-full border-2 border-white" 
                alt="User" 
              />
              <div>
                <p className="font-bold text-lg">{userProfile.displayName}</p>
                <p className="text-xs opacity-80">{userProfile.email}</p>
              </div>
            </div>
            <div className="flex justify-between items-center bg-blue-700 bg-opacity-50 px-3 py-2 rounded text-sm">
               <span><i className="fas fa-coins text-yellow-400 mr-2"></i> পয়েন্ট</span>
               <span className="font-bold">{userProfile.points}</span>
            </div>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-2 gap-3">
            <Link to="/login" onClick={onClose} className="text-center py-2 border border-blue-600 text-blue-600 rounded-lg font-bold">লগইন</Link>
            <Link to="/register" onClick={onClose} className="text-center py-2 bg-blue-600 text-white rounded-lg font-bold shadow">নিবন্ধন</Link>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-grow overflow-y-auto p-4 space-y-1">
          <NavLink to="/" icon="fa-home" label="হোম" />
          <NavLink to="/courses" icon="fa-book-open" label="কোর্সসমূহ" />
          <NavLink to="/exams" icon="fa-edit" label="লাইভ এক্সাম" />
          <NavLink to="/news" icon="fa-newspaper" label="খবর ও নোটিশ" />
          <div className="border-t my-2"></div>
          
          {userProfile && (
            <>
               <NavLink to="/profile" icon="fa-user-circle" label="আমার প্রোফাইল" />
               <NavLink to="/courses" icon="fa-graduation-cap" label="আমার এনরোলমেন্ট" />
               {userProfile.role === UserRole.ADMIN && (
                 <NavLink to="/admin" icon="fa-shield-alt" label="অ্যাডমিন প্যানেল" />
               )}
               <button 
                 onClick={handleLogout} 
                 className="w-full flex items-center space-x-4 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
               >
                 <div className="w-8 flex justify-center"><i className="fas fa-sign-out-alt"></i></div>
                 <span className="font-semibold">লগআউট</span>
               </button>
            </>
          )}
        </div>

        {/* Footer Links */}
        <div className="p-4 border-t text-xs text-gray-500 text-center">
          <div className="flex justify-center space-x-4 mb-3 text-lg text-gray-400">
             {config?.contact.social.fb && <a href={config.contact.social.fb}><i className="fab fa-facebook"></i></a>}
             {config?.contact.social.yt && <a href={config.contact.social.yt}><i className="fab fa-youtube"></i></a>}
          </div>
          <p>© 2024 {config?.siteName}</p>
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;