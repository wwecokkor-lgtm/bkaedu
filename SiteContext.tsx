import React, { createContext, useContext, useEffect, useState } from 'react';
import { SiteConfig } from './types';
import { getSiteConfig } from './api';

interface SiteContextType {
  config: SiteConfig | null;
  loading: boolean;
  refreshConfig: () => Promise<void>;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export const useSite = () => {
  const context = useContext(SiteContext);
  if (!context) throw new Error('useSite must be used within a SiteProvider');
  return context;
};

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    const data = await getSiteConfig();
    setConfig(data);
    
    // Apply Theme Globally
    if (data.theme) {
      document.documentElement.style.setProperty('--primary-color', data.theme.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', data.theme.secondaryColor);
      document.documentElement.style.fontFamily = data.theme.fontFamily || 'Hind Siliguri, sans-serif';
    }
    
    // Set Favicon
    if (data.logos.favicon) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) link.href = data.logos.favicon;
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <SiteContext.Provider value={{ config, loading, refreshConfig: fetchConfig }}>
      {children}
    </SiteContext.Provider>
  );
};