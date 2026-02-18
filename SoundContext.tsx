import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { getSoundAssets } from './api';
import { SoundAsset, SoundTrigger, SoundPreferences } from './types';

interface SoundContextType {
  playSound: (trigger: SoundTrigger) => void;
  preferences: SoundPreferences;
  updatePreferences: (prefs: Partial<SoundPreferences>) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) throw new Error('useSound must be used within a SoundProvider');
  return context;
};

// Fixed: Replaced broken Base64 with valid Google Sound Library URLs
const DEFAULT_SOUNDS: Record<string, string> = {
  click: 'https://actions.google.com/sounds/v1/ui/click_on_off.ogg',
  success: 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg',
  error: 'https://actions.google.com/sounds/v1/cartoon/clank_car_crash.ogg',
  notification: 'https://actions.google.com/sounds/v1/cartoon/pop.ogg'
};

const DEFAULT_PREFS: SoundPreferences = {
  masterVolume: 0.8,
  muted: false,
  categories: {
    ui: true,
    notification: true,
    lesson: true,
    event: true,
    alert: true
  }
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sounds, setSounds] = useState<SoundAsset[]>([]);
  const [preferences, setPreferences] = useState<SoundPreferences>(() => {
    const stored = localStorage.getItem('bk_sound_prefs');
    return stored ? JSON.parse(stored) : DEFAULT_PREFS;
  });
  
  // Refs to access latest state inside event listeners without re-binding
  const preferencesRef = useRef(preferences);
  const soundsRef = useRef(sounds);
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    preferencesRef.current = preferences;
    localStorage.setItem('bk_sound_prefs', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    soundsRef.current = sounds;
  }, [sounds]);

  useEffect(() => {
    // 1. Fetch Sound Assets
    const init = async () => {
      const assets = await getSoundAssets();
      setSounds(assets);
      
      // 2. Preload UI Sounds for low latency
      const uiSounds = assets.filter(s => s.category === 'ui' && s.isEnabled);
      uiSounds.forEach(s => {
        const audio = new Audio(s.url);
        audio.preload = 'auto';
        audioCache.current[s.trigger] = audio;
      });
    };
    init();
  }, []);

  // --- GLOBAL CLICK LISTENER ---
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Find if clicked element is interactive
      const target = e.target as HTMLElement;
      const clickable = target.closest('button, a, input[type="submit"], input[type="button"], [role="button"]');
      
      if (clickable) {
        // Play click sound globally
        playSound('click');
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const playSound = (trigger: SoundTrigger) => {
    const prefs = preferencesRef.current;
    if (prefs.muted) return;

    // Find configured sound from Ref
    const asset = soundsRef.current.find(s => s.trigger === trigger && s.isEnabled);
    
    // Check Category Mute
    if (asset && !prefs.categories[asset.category]) return;

    let audio: HTMLAudioElement | null = null;
    let volume = prefs.masterVolume;

    try {
      if (asset) {
        // Use cached if available, else create new
        if (audioCache.current[trigger]) {
          audio = audioCache.current[trigger];
          if (!audio.paused) {
             // Clone for overlapping sounds (rapid clicks)
             audio = audio.cloneNode() as HTMLAudioElement;
          }
        } else {
          audio = new Audio(asset.url);
        }
        
        if (asset.volume) volume *= asset.volume;
      } else {
        // Fallback to default sounds
        const defaultSrc = DEFAULT_SOUNDS[trigger];
        if (defaultSrc) {
           audio = new Audio(defaultSrc);
           volume *= 0.5; // Default sounds a bit quieter
        }
      }

      if (audio) {
        audio.volume = Math.max(0, Math.min(1, volume));
        const playPromise = audio.play();
        
        // Handle play promise to catch "no supported sources" or autoplay blocks
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            // Silently fail if it's just a missing source or interaction issue to prevent console spam
            if (error.name === 'NotSupportedError' || error.message.includes('no supported sources')) {
               // console.warn(`Sound missing or unsupported for trigger: ${trigger}`);
            } else {
               console.error("Audio playback error:", error);
            }
          });
        }
      }
    } catch (e) {
      console.error("Error initializing audio:", e);
    }
  };

  // Mute Toggle
  const toggleMute = () => {
    setPreferences(prev => ({ ...prev, muted: !prev.muted }));
  };

  const updatePreferences = (newPrefs: Partial<SoundPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  };

  return (
    <SoundContext.Provider value={{ playSound, preferences, updatePreferences, isMuted: preferences.muted, toggleMute }}>
      {children}
    </SoundContext.Provider>
  );
};
