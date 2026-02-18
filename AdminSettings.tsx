import React, { useState, useEffect } from 'react';
import { getSiteConfig, updateSiteConfig } from './api';
import { SiteConfig } from './types'; // Import from types

const AdminSettings = () => {
  const [settings, setSettings] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSiteConfig().then(setSettings);
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setLoading(true);
    await updateSiteConfig(settings);
    setLoading(false);
    alert("সেটিংস সংরক্ষিত হয়েছে!");
  };

  if (!settings) return <div>লোড হচ্ছে...</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b">ওয়েবসাইট সেটিংস (Legacy)</h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">সাইটের নাম</label>
            <input 
              type="text" 
              value={settings.siteName}
              onChange={e => setSettings({...settings, siteName: e.target.value})}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">ডেস্কটপ লোগো URL</label>
             <input 
               type="text" 
               value={settings.logos.desktop || ''}
               onChange={e => setSettings({...settings, logos: {...settings.logos, desktop: e.target.value}})}
               className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
             />
          </div>
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-1">ঘোষণা টেক্সট</label>
           <input 
             type="text" 
             value={settings.announcement.text}
             onChange={e => setSettings({...settings, announcement: {...settings.announcement, text: e.target.value}})}
             className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
           />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-bold text-gray-800 mb-4">কন্ট্রোল সুইচ</h3>
          <div className="space-y-3">
             <label className="flex items-center space-x-3 cursor-pointer">
               <input 
                 type="checkbox" 
                 checked={settings.features.registration}
                 onChange={e => setSettings({...settings, features: {...settings.features, registration: e.target.checked}})}
                 className="form-checkbox h-5 w-5 text-blue-600" 
               />
               <span className="text-gray-700">নতুন রেজিস্ট্রেশন চালু রাখুন</span>
             </label>

             <label className="flex items-center space-x-3 cursor-pointer">
               <input 
                 type="checkbox" 
                 checked={settings.features.maintenance}
                 onChange={e => setSettings({...settings, features: {...settings.features, maintenance: e.target.checked}})}
                 className="form-checkbox h-5 w-5 text-red-600" 
               />
               <span className="text-gray-700 font-medium">মেইনটেনেন্স মোড</span>
             </label>
          </div>
        </div>

        <div className="pt-4">
           <button 
             onClick={handleSave} 
             disabled={loading}
             className="bg-blue-600 text-white px-8 py-3 rounded font-bold hover:bg-blue-700 shadow-lg"
           >
             {loading ? 'সেভ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;