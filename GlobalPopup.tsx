import React, { useEffect, useState } from 'react';
import { Popup } from './types';
import { getPopups } from './api';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

const GlobalPopup = () => {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [activePopup, setActivePopup] = useState<Popup | null>(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    getPopups().then(data => setPopups(data.filter(p => p.isActive)));
  }, []);

  useEffect(() => {
    if (popups.length === 0) return;

    // 1. Time Delayed Popups (Welcome/Promo)
    const delayedPopups = popups.filter(p => p.type === 'welcome' || p.type === 'promo' || p.type === 'alert');
    
    delayedPopups.forEach(popup => {
       const hasSeen = localStorage.getItem(`popup_${popup.id}`);
       if (popup.showOnce && hasSeen) return;

       const timer = setTimeout(() => {
          setActivePopup(popup);
          if (popup.showOnce) localStorage.setItem(`popup_${popup.id}`, 'true');
       }, popup.triggerDelay * 1000);

       return () => clearTimeout(timer);
    });

    // 2. Exit Intent Popup
    const exitPopup = popups.find(p => p.type === 'exit');
    if (exitPopup) {
       const handleExit = (e: MouseEvent) => {
          if (e.clientY <= 0) {
             const hasSeen = localStorage.getItem(`popup_${exitPopup.id}`);
             if (exitPopup.showOnce && hasSeen) return;
             setActivePopup(exitPopup);
             if (exitPopup.showOnce) localStorage.setItem(`popup_${exitPopup.id}`, 'true');
             document.removeEventListener('mouseleave', handleExit);
          }
       };
       document.addEventListener('mouseleave', handleExit);
       return () => document.removeEventListener('mouseleave', handleExit);
    }
  }, [popups]);

  if (!activePopup) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity"
        onClick={() => setActivePopup(null)}
      ></div>

      {/* Popup Content */}
      <div className="bg-white rounded-2xl shadow-2xl z-10 w-full max-w-lg overflow-hidden relative animate-bounce-in">
        <button 
          onClick={() => setActivePopup(null)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 bg-white rounded-full p-1"
        >
          <i className="fas fa-times text-xl"></i>
        </button>

        {activePopup.imageUrl && (
          <img src={activePopup.imageUrl} alt={activePopup.title} className="w-full h-48 object-cover" />
        )}

        <div className="p-8 text-center">
           <h3 className="text-2xl font-bold text-gray-800 mb-3">{activePopup.title}</h3>
           <p className="text-gray-600 mb-6 whitespace-pre-line">{activePopup.content}</p>
           
           {activePopup.ctaText && (
             <Link 
               to={activePopup.ctaLink || '#'} 
               onClick={() => setActivePopup(null)}
               className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition shadow-lg transform hover:-translate-y-1"
             >
               {activePopup.ctaText}
             </Link>
           )}
        </div>
      </div>
    </div>
  );
};

export default GlobalPopup;