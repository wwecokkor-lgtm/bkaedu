import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useSite } from './SiteContext'; // Import Site Context
import { UserRole, Notification, SearchResult } from './types';
import { searchGlobal, subscribeToNotifications, markAllNotificationsAsRead, markNotificationAsRead } from './api';
import MobileDrawer from './MobileDrawer';
import { useSound } from './SoundContext';

const Navbar = () => {
  const { userProfile, logout } = useAuth();
  const { config } = useSite(); // Get dynamic config
  const { isMuted, toggleMute } = useSound();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Dropdowns
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCoursesMenu, setShowCoursesMenu] = useState(false);

  // Refs
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Real-time Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (userProfile) {
      const unsubscribe = subscribeToNotifications(userProfile.uid, (data) => {
        setNotifications(data);
      });
      return () => unsubscribe();
    } else {
      setNotifications([]);
    }
  }, [userProfile]);

  useEffect(() => {
    setShowMobileMenu(false);
    setShowProfileMenu(false);
    setShowCoursesMenu(false);
    setShowSearch(false);
    setShowNotifications(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 2) {
      setIsSearching(true);
      const results = await searchGlobal(term);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    if (userProfile) {
      await markAllNotificationsAsRead(userProfile.uid);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      await markNotificationAsRead(n.id);
    }
    if (n.link) {
      navigate(n.link);
      setShowNotifications(false);
    }
  };

  const handleCartClick = () => {
    alert("আপনার কার্ট বর্তমানে ফাঁকা।");
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const isHome = location.pathname === '/';
  const navBackground = isHome && !isScrolled ? 'bg-transparent' : 'bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100';
  const textColor = isHome && !isScrolled ? 'text-white' : 'text-gray-800';
  const hoverColor = isHome && !isScrolled ? 'hover:text-blue-200' : 'hover:text-blue-600';
  const logoText = isHome && !isScrolled ? 'text-white' : 'text-gray-900';

  return (
    <>
      <nav 
        className={`sticky top-0 z-50 w-full transition-all duration-300 ease-in-out ${navBackground} ${isScrolled ? 'py-2 md:py-3' : 'py-3 md:py-5'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12 md:h-12">
            
            {/* Dynamic Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center group">
                 {config?.logos.desktop ? (
                   <img 
                     src={config.logos.desktop} 
                     alt={config.siteName} 
                     className="h-10 md:h-12 w-auto object-contain mr-2 transition-transform duration-300 group-hover:scale-105" 
                   />
                 ) : (
                   <div className="h-9 w-9 md:h-10 md:w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl mr-2 md:mr-3 shadow-lg">
                     {config?.siteName.charAt(0) || 'B'}
                   </div>
                 )}
                 <div>
                   <span className={`font-bold text-lg md:text-xl tracking-tight leading-none block ${logoText} transition-colors`}>
                     {config?.siteName || 'BK Academy'}
                   </span>
                   <span className={`text-[9px] md:text-[10px] font-bold tracking-[0.2em] block uppercase hidden sm:block ${isHome && !isScrolled ? 'text-blue-200' : 'text-blue-600'}`}>
                     Learn & Grow
                   </span>
                 </div>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className={`hidden md:flex items-center space-x-8 ${textColor}`}>
              <Link to="/" className={`font-medium text-sm transition-colors ${hoverColor}`}>Home</Link>
              
              <div 
                className="relative group"
                onMouseEnter={() => setShowCoursesMenu(true)}
                onMouseLeave={() => setShowCoursesMenu(false)}
              >
                <button className={`font-medium text-sm flex items-center py-2 transition-colors ${hoverColor}`}>
                  Courses <i className={`fas fa-chevron-down ml-1.5 text-xs opacity-70`}></i>
                </button>
                {showCoursesMenu && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-[600px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 grid grid-cols-2 gap-6 mt-2 opacity-100 scale-100 transition-all z-50 animate-fade-in-up text-gray-800">
                     <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-100"></div>
                     
                     <div>
                       <h4 className="font-bold text-gray-900 mb-4 border-b pb-2">Popular Categories</h4>
                       <ul className="space-y-3 text-sm text-gray-600">
                         <li><Link to="/courses?cat=programming" className="hover:text-blue-600 flex items-center group"><span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mr-3 group-hover:bg-blue-600 group-hover:text-white transition"><i className="fas fa-code"></i></span> Development</Link></li>
                         <li><Link to="/courses?cat=design" className="hover:text-blue-600 flex items-center group"><span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center mr-3 group-hover:bg-purple-600 group-hover:text-white transition"><i className="fas fa-paint-brush"></i></span> Design</Link></li>
                         <li><Link to="/courses?cat=business" className="hover:text-blue-600 flex items-center group"><span className="w-8 h-8 rounded-lg bg-green-50 text-green-500 flex items-center justify-center mr-3 group-hover:bg-green-600 group-hover:text-white transition"><i className="fas fa-chart-line"></i></span> Business</Link></li>
                       </ul>
                     </div>
                     <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-5 rounded-xl border border-blue-100 flex flex-col justify-between">
                       <div>
                         <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Hot</span>
                         <h4 className="font-bold text-gray-900 mt-2 text-lg">Special Offer!</h4>
                         <p className="text-xs text-gray-500 mt-1 mb-4 leading-relaxed">Get 50% discount on all premium courses this week.</p>
                       </div>
                       <Link to="/courses" className="block text-center bg-blue-600 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition">Explore Courses</Link>
                     </div>
                  </div>
                )}
              </div>

              <Link to="/exams" className={`font-medium text-sm transition-colors ${hoverColor}`}>Exams</Link>
              <Link to="/news" className={`font-medium text-sm transition-colors ${hoverColor}`}>News</Link>
              
              {userProfile?.role === UserRole.ADMIN && (
                <Link to="/admin" className="text-purple-600 hover:text-purple-800 font-bold text-xs transition-colors border border-purple-200 bg-purple-50 px-3 py-1.5 rounded-full flex items-center hover:bg-purple-100">
                  <i className="fas fa-shield-alt mr-1.5"></i> Admin
                </Link>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2 md:space-x-4">
              
              <button 
                onClick={toggleMute}
                className={`p-2 rounded-full transition-colors ${textColor} hover:bg-white/20`}
                title={isMuted ? "Unmute Sounds" : "Mute Sounds"}
              >
                <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'} text-lg`}></i>
              </button>

              <div className="relative" ref={searchRef}>
                 <button 
                   className={`p-2 rounded-full transition-all duration-300 ${showSearch ? 'bg-white text-gray-800 shadow-lg' : `${textColor} hover:bg-white/20`}`}
                   onClick={() => setShowSearch(!showSearch)}
                 >
                    <i className="fas fa-search text-lg"></i>
                 </button>

                 {showSearch && (
                   <div className="absolute right-[-60px] md:right-0 top-full mt-3 w-[calc(100vw-32px)] max-w-[320px] md:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in-up p-2">
                      <div className="relative">
                        <i className="fas fa-search absolute left-3 top-3.5 text-gray-400"></i>
                        <input 
                          type="text" 
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                          placeholder="Search courses, exams..."
                          value={searchTerm}
                          onChange={handleSearch}
                          autoFocus
                        />
                      </div>
                      
                      {searchTerm.length > 2 && (
                        <div className="mt-2 max-h-60 overflow-y-auto custom-scrollbar">
                          {isSearching ? (
                            <div className="p-4 text-center text-gray-500 text-xs">Searching...</div>
                          ) : searchResults.length > 0 ? (
                            <ul>
                              {searchResults.map((res, idx) => (
                                <li key={idx} className="border-b last:border-0 border-gray-50">
                                  <Link to={res.url} className="block px-3 py-2.5 hover:bg-blue-50 rounded-lg transition" onClick={() => setShowSearch(false)}>
                                    <div className="flex items-center">
                                      <div className={`h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center mr-3 text-xs ${res.type === 'course' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                        <i className={`fas ${res.type === 'course' ? 'fa-book-open' : res.type === 'news' ? 'fa-newspaper' : 'fa-edit'}`}></i>
                                      </div>
                                      <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-gray-800 truncate">{res.title}</p>
                                      </div>
                                    </div>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="p-4 text-center text-gray-500 text-xs">No results found</div>
                          )}
                        </div>
                      )}
                   </div>
                 )}
              </div>

              <button 
                onClick={handleCartClick}
                className={`relative p-2 rounded-full transition-colors ${textColor} hover:bg-white/20 hidden xs:block`}
              >
                <i className="fas fa-shopping-bag text-lg"></i>
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">0</span>
              </button>

              {userProfile ? (
                <>
                  <div className="relative" ref={notifRef}>
                    <button 
                      className={`relative p-2 rounded-full transition-colors ${textColor} hover:bg-white/20`}
                      onClick={() => setShowNotifications(!showNotifications)}
                    >
                      <i className="far fa-bell text-lg"></i>
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-2 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                      )}
                    </button>
                    {showNotifications && (
                      <div className="absolute right-[-40px] md:right-0 mt-4 w-[calc(100vw-40px)] max-w-[320px] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in-up">
                        <div className="px-5 py-4 border-b flex justify-between items-center bg-gray-50">
                          <h4 className="text-sm font-bold text-gray-800">Notifications ({unreadCount})</h4>
                          {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline font-medium">Mark all read</button>
                          )}
                        </div>
                        <ul className="max-h-72 overflow-y-auto custom-scrollbar">
                          {notifications.length === 0 ? (
                            <li className="px-5 py-8 text-center text-gray-500 text-sm">No new notifications.</li>
                          ) : (
                            notifications.map(n => (
                              <li 
                                key={n.id} 
                                onClick={() => handleNotificationClick(n)}
                                className={`px-5 py-4 hover:bg-gray-50 border-b last:border-0 transition cursor-pointer ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs text-white ${n.type === 'info' ? 'bg-blue-500' : n.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                                    <i className={`fas ${n.type === 'info' ? 'fa-info' : n.type === 'success' ? 'fa-check' : 'fa-exclamation'}`}></i>
                                  </div>
                                  <div className="flex-grow">
                                    <p className={`text-sm text-gray-800 leading-tight ${!n.isRead ? 'font-bold' : 'font-normal'}`}>{n.title}</p>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                                  </div>
                                </div>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="relative ml-1" ref={profileRef}>
                    <button 
                      className={`flex items-center space-x-2 focus:outline-none p-1 pr-1 md:pr-3 rounded-full transition-all ${isHome && !isScrolled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                      <img 
                        className="h-8 w-8 rounded-full object-cover border-2 border-white shadow-sm" 
                        src={userProfile.photoURL || 'https://via.placeholder.com/150'} 
                        alt={userProfile.displayName} 
                      />
                      <span className="text-xs font-bold hidden md:block max-w-[80px] truncate">{(userProfile.displayName || 'User').split(' ')[0]}</span>
                      <i className="fas fa-chevron-down text-[10px] opacity-70 hidden md:block"></i>
                    </button>
                    
                    {showProfileMenu && (
                      <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in-up">
                         <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                           <p className="text-base font-bold truncate">{userProfile.displayName}</p>
                           <p className="text-xs text-blue-100 truncate">{userProfile.email}</p>
                           <div className="mt-3 flex items-center justify-between bg-white/20 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                              <span className="text-xs font-medium"><i className="fas fa-coins text-yellow-300 mr-1.5"></i> Points</span>
                              <span className="text-sm font-bold">{userProfile.points}</span>
                           </div>
                         </div>
                         <div className="py-2">
                           <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition">
                             <i className="far fa-user mr-3"></i> My Profile
                           </Link>
                           <Link to="/courses" onClick={() => setShowProfileMenu(false)} className="px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition">
                             <i className="fas fa-book mr-3"></i> My Learning
                           </Link>
                           {userProfile.role === UserRole.ADMIN && (
                             <Link to="/admin" onClick={() => setShowProfileMenu(false)} className="px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition">
                               <i className="fas fa-sliders-h mr-3"></i> Dashboard
                             </Link>
                           )}
                         </div>
                         <div className="border-t border-gray-100 p-2">
                           <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center font-medium transition">
                             <i className="fas fa-sign-out-alt mr-3"></i> Logout
                           </button>
                         </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Link to="/login" className={`font-bold text-sm px-4 py-2 rounded-full transition ${isHome && !isScrolled ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}>Login</Link>
                  <Link to="/register" className="bg-blue-600 text-white font-bold text-sm px-6 py-2.5 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all">Join Free</Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button 
                className={`md:hidden p-2 text-lg transition-colors ${textColor}`}
                onClick={() => setShowMobileMenu(true)}
              >
                <i className="fas fa-bars"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile Drawer */}
      <MobileDrawer isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />
    </>
  );
};

export default Navbar;