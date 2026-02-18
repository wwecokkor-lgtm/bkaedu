import React, { createContext, useContext, useEffect, useState } from 'react';
import { mediaStorage } from './mediaStorage';

interface OfflineContextType {
  isOnline: boolean;
  saveDraft: (key: string, data: any) => void;
  getDraft: (key: string) => any;
  clearDraft: (key: string) => void;
  syncStatus: 'synced' | 'syncing' | 'offline';
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within an OfflineProvider');
  return context;
};

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>(navigator.onLine ? 'synced' : 'offline');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      
      // Simulate Sync Process
      setTimeout(() => {
        setSyncStatus('synced');
        console.log('App Synced with Server');
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- DRAFT SYSTEM (IndexedDB Wrapper via mediaStorage logic or LocalStorage) ---
  // Using LocalStorage for small drafts for simplicity & speed
  const saveDraft = (key: string, data: any) => {
    try {
      localStorage.setItem(`draft_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error("Draft save failed", e);
    }
  };

  const getDraft = (key: string) => {
    try {
      const item = localStorage.getItem(`draft_${key}`);
      return item ? JSON.parse(item).data : null;
    } catch (e) {
      return null;
    }
  };

  const clearDraft = (key: string) => {
    localStorage.removeItem(`draft_${key}`);
  };

  return (
    <OfflineContext.Provider value={{ isOnline, saveDraft, getDraft, clearDraft, syncStatus }}>
      {children}
      
      {/* Offline/Sync Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center animate-pulse">
          <i className="fas fa-wifi-slash mr-2 text-red-400"></i> Offline Mode
        </div>
      )}
      {isOnline && syncStatus === 'syncing' && (
        <div className="fixed bottom-4 left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm flex items-center">
          <i className="fas fa-sync fa-spin mr-2"></i> Syncing...
        </div>
      )}
    </OfflineContext.Provider>
  );
};