import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav'; // Mobile Navigation
import { useSite } from './SiteContext';
import MysteryZone from './MysteryZone';

const Layout = () => {
  const [showTopBtn, setShowTopBtn] = useState(false);
  const location = useLocation();
  const { config, loading } = useSite();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const goToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (loading) return null;

  // Determine if we are in a fullscreen mode (like exam/player) where navs should be hidden
  // For standard layout, we keep them.
  const isFullScreen = location.pathname.includes('/learn/');

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50" style={{fontFamily: config?.theme.fontFamily}}>
      
      {/* Interactive Campaign Elements */}
      <MysteryZone />

      {/* Announcement Bar */}
      {config?.announcement.enabled && !isFullScreen && (
         <div 
           className="px-4 py-2 text-center text-xs md:text-sm font-bold animate-fade-in-down relative z-50 truncate"
           style={{ backgroundColor: config.announcement.bgColor, color: config.announcement.textColor }}
         >
            {config.announcement.text}
            {config.announcement.link && (
               <Link to={config.announcement.link} className="ml-2 underline hover:opacity-80">Learn More</Link>
            )}
         </div>
      )}

      {/* --- TOP BAR (Desktop Only) --- */}
      {!isFullScreen && (
        <div className="bg-gray-900 text-gray-300 py-2 text-xs font-medium hidden md:block border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex space-x-4">
              {config?.contact.phone && <span><i className="fas fa-phone-alt mr-2 text-blue-400"></i>{config.contact.phone}</span>}
              {config?.contact.email && <span><i className="fas fa-envelope mr-2 text-blue-400"></i>{config.contact.email}</span>}
            </div>
            <div className="flex space-x-4 items-center">
              {config?.contact.social.fb && <a href={config.contact.social.fb} target="_blank" rel="noreferrer" className="hover:text-white"><i className="fab fa-facebook-f"></i></a>}
              {config?.contact.social.yt && <a href={config.contact.social.yt} target="_blank" rel="noreferrer" className="hover:text-white"><i className="fab fa-youtube"></i></a>}
              {config?.contact.social.tw && <a href={config.contact.social.tw} target="_blank" rel="noreferrer" className="hover:text-white"><i className="fab fa-twitter"></i></a>}
              
              <span className="border-l border-gray-700 h-4 mx-2"></span>
              <button className="hover:text-white">বাংলা</button>
              <span>/</span>
              <button className="hover:text-white">English</button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Navbar */}
      {!isFullScreen && <Navbar />}

      {/* Main Content (Added padding bottom for mobile nav) */}
      <main className={`flex-grow ${!isFullScreen ? 'pb-20 md:pb-0' : ''}`}>
        <div className="max-w-7xl mx-auto py-4 md:py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      {!isFullScreen && (
        <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 mb-16 md:mb-0">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center text-white text-2xl font-bold">
                {config?.logos.footer ? (
                   <img src={config.logos.footer} className="h-10 mr-3" alt="Logo" />
                ) : (
                   <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-lg text-sm">BK</div>
                )}
                {config?.siteName}
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {config?.siteDescription}
              </p>
              <div className="flex space-x-4 pt-2">
                {config?.contact.social.fb && <a href={config.contact.social.fb} target="_blank" rel="noreferrer" className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition"><i className="fab fa-facebook-f"></i></a>}
                {config?.contact.social.yt && <a href={config.contact.social.yt} target="_blank" rel="noreferrer" className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center hover:bg-red-600 hover:text-white transition"><i className="fab fa-youtube"></i></a>}
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="hidden md:block">
              <h3 className="text-white font-bold text-lg mb-6 relative inline-block">
                কুইক লিঙ্কস
                <span className="absolute bottom-[-8px] left-0 w-10 h-1 bg-blue-600 rounded"></span>
              </h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/courses" className="hover:text-blue-400 transition flex items-center"><i className="fas fa-angle-right mr-2 text-xs"></i> সব কোর্স</Link></li>
                <li><Link to="/exams" className="hover:text-blue-400 transition flex items-center"><i className="fas fa-angle-right mr-2 text-xs"></i> লাইভ এক্সাম</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className="hidden md:block">
              <h3 className="text-white font-bold text-lg mb-6 relative inline-block">
                সাপোর্ট
                <span className="absolute bottom-[-8px] left-0 w-10 h-1 bg-blue-600 rounded"></span>
              </h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/support" className="hover:text-blue-400 transition flex items-center"><i className="fas fa-headset mr-2 text-xs"></i> হেল্প সেন্টার</Link></li>
                <li><Link to="/contact" className="hover:text-blue-400 transition flex items-center"><i className="fas fa-envelope mr-2 text-xs"></i> Contact Us</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-white font-bold text-lg mb-6 relative inline-block">
                যোগাযোগ
                <span className="absolute bottom-[-8px] left-0 w-10 h-1 bg-blue-600 rounded"></span>
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start">
                   <i className="fas fa-map-marker-alt mt-1 mr-3 text-blue-500"></i>
                   <p className="whitespace-pre-line">{config?.contact.address}</p>
                </div>
                <div className="flex items-center">
                   <i className="fas fa-phone-alt mr-3 text-blue-500"></i>
                   <p>{config?.contact.phone}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-950 py-6 border-t border-gray-800">
             <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
               <p>&copy; {new Date().getFullYear()} {config?.siteName}. All rights reserved.</p>
               <div className="flex space-x-4 mt-2 md:mt-0">
                 <Link to="/privacy" className="hover:text-white">Privacy</Link>
                 <Link to="/terms" className="hover:text-white">Terms</Link>
               </div>
             </div>
          </div>
        </footer>
      )}

      {/* Mobile Sticky Bottom Nav */}
      {!isFullScreen && <BottomNav />}

      {/* Back to Top Button */}
      {showTopBtn && !isFullScreen && (
        <button 
          onClick={goToTop} 
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 bg-blue-600 text-white w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-110 z-40 flex items-center justify-center animate-fade-in-up"
        >
          <i className="fas fa-arrow-up"></i>
        </button>
      )}
    </div>
  );
};

export default Layout;