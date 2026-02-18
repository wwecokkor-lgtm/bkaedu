import React, { useState, useEffect, useRef } from 'react';
import { SiteConfig, Slide, Popup, MediaFile } from './types';
import { getSiteConfig, updateSiteConfig, getSlides, saveSlide, deleteSlide, getPopups, savePopup, deletePopup } from './api';
import { useAuth } from './AuthContext';
import { useSite } from './SiteContext';

// --- PROFESSIONAL IMAGE COMPRESSION UTILITY (Client-Side Realtime) ---
const compressAndConvertToBase64 = (file: File, maxWidth: number = 800, quality: number = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize Logic
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Convert to Base64 (Data URI)
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
        } else {
            reject(new Error("Canvas failed"));
        }
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const AdminWebsiteControl = () => {
  const { userProfile } = useAuth();
  const { refreshConfig } = useSite();
  const [activeTab, setActiveTab] = useState<'general' | 'theme' | 'contact' | 'slider' | 'popups' | 'layout'>('general');
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(false);

  // Load Config
  useEffect(() => {
    getSiteConfig().then(setConfig);
  }, []);

  const handleSaveConfig = async () => {
    if (!config) return;
    setLoading(true);
    await updateSiteConfig(config);
    await refreshConfig();
    setLoading(false);
    alert("Settings saved successfully!");
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile' | 'favicon' | 'footer') => {
    if (e.target.files && e.target.files[0] && config) {
      setLoading(true);
      try {
        const maxWidth = type === 'favicon' ? 128 : (type === 'mobile' ? 400 : 800);
        // Direct Base64 conversion for instant Real-time update
        const base64 = await compressAndConvertToBase64(e.target.files[0], maxWidth, 0.9);
        
        setConfig({
          ...config,
          logos: { ...config.logos, [type]: base64 }
        });
      } catch (error) {
        alert("Upload failed. Try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // DnD Logic for Layout
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && config) {
        const newSections = [...config.homeSections];
        const draggedItemContent = newSections.splice(dragItem.current, 1)[0];
        newSections.splice(dragOverItem.current, 0, draggedItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;
        setConfig({ ...config, homeSections: newSections });
    }
  };

  if (!config) return <div>Loading Control Panel...</div>;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 min-h-[600px] flex flex-col overflow-hidden relative">
      
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl md:text-2xl font-bold"><i className="fas fa-sliders-h mr-3"></i> Website Control</h2>
           <p className="text-gray-400 text-xs md:text-sm">Manage content, design, and features.</p>
        </div>
        <button 
          onClick={handleSaveConfig} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center w-full md:w-auto justify-center"
        >
          {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>}
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-gray-50 overflow-x-auto no-scrollbar">
         {['general', 'theme', 'contact', 'slider', 'popups', 'layout'].map(tab => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab as any)}
             className={`px-4 md:px-6 py-3 md:py-4 font-bold text-xs md:text-sm uppercase tracking-wide transition whitespace-nowrap ${activeTab === tab ? 'bg-white border-t-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
           >
             {tab}
           </button>
         ))}
      </div>

      {/* Content */}
      <div className="p-4 md:p-8 flex-grow overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
        
        {/* --- GENERAL SETTINGS --- */}
        {activeTab === 'general' && (
           <div className="space-y-8 max-w-5xl">
              {/* Site Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Site Name</label>
                    <input 
                      type="text" 
                      value={config.siteName} 
                      onChange={e => setConfig({...config, siteName: e.target.value})} 
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description (SEO)</label>
                    <input 
                      type="text" 
                      value={config.siteDescription} 
                      onChange={e => setConfig({...config, siteDescription: e.target.value})} 
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                    />
                 </div>
              </div>

              {/* Logos */}
              <div className="bg-gray-50 p-4 md:p-6 rounded-lg border">
                 <h3 className="font-bold text-gray-800 mb-4 flex flex-col md:flex-row md:items-center">
                    Branding & Logos
                    <span className="md:ml-2 mt-1 md:mt-0 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded w-fit">Auto-Optimization Enabled</span>
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    
                    {/* Helper Component for Logo Card */}
                    {[
                        { type: 'desktop', label: 'Desktop Logo', dim: 'H-24' },
                        { type: 'mobile', label: 'Mobile Logo', dim: 'H-24 W-24 rounded-full' },
                        { type: 'favicon', label: 'Favicon', dim: 'H-16 W-16 rounded' },
                        { type: 'footer', label: 'Footer Logo', dim: 'H-20' }
                    ].map((item) => (
                        <div key={item.type} className="text-center group relative">
                            <div className={`mx-auto bg-white border border-dashed border-gray-300 flex items-center justify-center mb-3 overflow-hidden relative shadow-sm hover:shadow-md transition-all ${item.type === 'mobile' ? 'w-32 h-32 rounded-full' : 'h-32 w-full rounded-lg'}`}>
                                {config.logos[item.type as keyof typeof config.logos] ? (
                                    <img 
                                        src={config.logos[item.type as keyof typeof config.logos]} 
                                        className="max-h-full max-w-full object-contain p-2" 
                                        alt={item.label}
                                    />
                                ) : (
                                    <span className="text-gray-400 text-xs">No Image</span>
                                )}
                                
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 space-y-2">
                                    <label className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-500 transition shadow">
                                        Change
                                        <input type="file" className="hidden" accept="image/*" onChange={e => handleLogoUpload(e, item.type as any)} />
                                    </label>
                                </div>
                            </div>
                            <p className="text-sm font-bold text-gray-700">{item.label}</p>
                        </div>
                    ))}

                 </div>
              </div>

              {/* Announcement Bar */}
              <div className="bg-blue-50 p-4 md:p-6 rounded-lg border border-blue-100">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-blue-800">Top Announcement Bar</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={config.announcement.enabled} onChange={e => setConfig({...config, announcement: {...config.announcement, enabled: e.target.checked}})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                       <label className="block text-xs font-bold text-blue-700 mb-1">Announcement Text</label>
                       <input 
                         type="text" 
                         value={config.announcement.text} 
                         onChange={e => setConfig({...config, announcement: {...config.announcement, text: e.target.value}})} 
                         className="w-full border p-2 rounded"
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-blue-700 mb-1">Background Color</label>
                       <div className="flex items-center space-x-2">
                         <input type="color" value={config.announcement.bgColor} onChange={e => setConfig({...config, announcement: {...config.announcement, bgColor: e.target.value}})} className="h-8 w-8 rounded cursor-pointer" />
                         <span className="text-sm">{config.announcement.bgColor}</span>
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-blue-700 mb-1">Text Color</label>
                       <div className="flex items-center space-x-2">
                         <input type="color" value={config.announcement.textColor} onChange={e => setConfig({...config, announcement: {...config.announcement, textColor: e.target.value}})} className="h-8 w-8 rounded cursor-pointer" />
                         <span className="text-sm">{config.announcement.textColor}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* --- CONTACT & SOCIAL MEDIA --- */}
        {activeTab === 'contact' && (
           <div className="space-y-8 max-w-4xl animate-fade-in">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                 <h3 className="font-bold text-gray-800 mb-4 border-b pb-2"><i className="fas fa-address-card mr-2"></i> Footer Contact Information</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                       <label className="block text-sm font-bold text-gray-700 mb-1">Office Address</label>
                       <textarea 
                         value={config.contact.address} 
                         onChange={e => setConfig({...config, contact: {...config.contact, address: e.target.value}})} 
                         className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 h-20"
                         placeholder="e.g. Level-4, Mirpur DOHS, Dhaka"
                       ></textarea>
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                       <input 
                         type="text" 
                         value={config.contact.phone} 
                         onChange={e => setConfig({...config, contact: {...config.contact, phone: e.target.value}})} 
                         className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                         placeholder="+880 1711..."
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                       <input 
                         type="email" 
                         value={config.contact.email} 
                         onChange={e => setConfig({...config, contact: {...config.contact, email: e.target.value}})} 
                         className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                         placeholder="support@bkacademy.com"
                       />
                    </div>
                 </div>
              </div>

              <div className="bg-white p-6 rounded-lg border shadow-sm">
                 <h3 className="font-bold text-gray-800 mb-4 border-b pb-2"><i className="fas fa-share-alt mr-2"></i> Social Media Links</h3>
                 <p className="text-xs text-gray-500 mb-4">Leave field empty to hide the icon from the website.</p>
                 <div className="space-y-4">
                    {['fb', 'yt', 'tw', 'li'].map((social) => (
                        <div key={social} className="flex items-center space-x-3">
                           <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded flex items-center justify-center font-bold uppercase">{social}</div>
                           <div className="flex-grow">
                              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">{social} URL</label>
                              <input 
                                type="text" 
                                value={(config.contact.social as any)[social]} 
                                onChange={e => setConfig({...config, contact: {...config.contact, social: {...config.contact.social, [social]: e.target.value}}})} 
                                className="w-full border p-2 rounded"
                                placeholder={`https://${social}.com/...`}
                              />
                           </div>
                        </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* --- THEME SETTINGS --- */}
        {activeTab === 'theme' && (
           <div className="space-y-8 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">Color Palette</h3>
                    <div className="space-y-4">
                       <div>
                          <label className="block text-sm font-bold text-gray-600 mb-1">Primary Color (Brand)</label>
                          <div className="flex items-center space-x-3">
                             <input type="color" value={config.theme.primaryColor} onChange={e => setConfig({...config, theme: {...config.theme, primaryColor: e.target.value}})} className="h-10 w-16 cursor-pointer border rounded" />
                             <input type="text" value={config.theme.primaryColor} onChange={e => setConfig({...config, theme: {...config.theme, primaryColor: e.target.value}})} className="border p-2 rounded w-32 uppercase" />
                          </div>
                       </div>
                       <div>
                          <label className="block text-sm font-bold text-gray-600 mb-1">Secondary Color (Dark)</label>
                          <div className="flex items-center space-x-3">
                             <input type="color" value={config.theme.secondaryColor} onChange={e => setConfig({...config, theme: {...config.theme, secondaryColor: e.target.value}})} className="h-10 w-16 cursor-pointer border rounded" />
                             <input type="text" value={config.theme.secondaryColor} onChange={e => setConfig({...config, theme: {...config.theme, secondaryColor: e.target.value}})} className="border p-2 rounded w-32 uppercase" />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">Typography & Shape</h3>
                    <div className="space-y-4">
                       <div>
                          <label className="block text-sm font-bold text-gray-600 mb-1">Font Family</label>
                          <select 
                            value={config.theme.fontFamily} 
                            onChange={e => setConfig({...config, theme: {...config.theme, fontFamily: e.target.value}})}
                            className="w-full border p-2 rounded"
                          >
                             <option value="Hind Siliguri, sans-serif">Hind Siliguri (Bangla Default)</option>
                             <option value="Inter, sans-serif">Inter</option>
                             <option value="Roboto, sans-serif">Roboto</option>
                             <option value="Poppins, sans-serif">Poppins</option>
                          </select>
                       </div>
                       <div>
                          <label className="block text-sm font-bold text-gray-600 mb-1">Button Roundness</label>
                          <select 
                            value={config.theme.borderRadius} 
                            onChange={e => setConfig({...config, theme: {...config.theme, borderRadius: e.target.value}})}
                            className="w-full border p-2 rounded"
                          >
                             <option value="sm">Small (2px)</option>
                             <option value="md">Medium (4px)</option>
                             <option value="lg">Large (8px)</option>
                             <option value="full">Pill (Full)</option>
                          </select>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* --- HOMEPAGE LAYOUT --- */}
        {activeTab === 'layout' && (
           <div className="space-y-6 max-w-4xl">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                 <h3 className="font-bold text-gray-800 text-lg mb-2">Homepage Layout Manager</h3>
                 <p className="text-gray-500 text-sm mb-6">
                    Drag and drop sections to reorder them on the homepage. Toggle visibility to show or hide sections.
                 </p>
                 
                 <div className="space-y-2">
                    {config.homeSections.map((section, index) => (
                       <div 
                          key={section.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnter={(e) => handleDragEnter(e, index)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => e.preventDefault()}
                          className={`flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm transition-all duration-200 cursor-move hover:shadow-md ${!section.enabled ? 'opacity-60 bg-gray-50' : 'border-l-4 border-l-blue-500'}`}
                       >
                          <div className="flex items-center space-x-4">
                             <i className="fas fa-grip-vertical text-gray-400"></i>
                             <span className="font-bold text-gray-700">{section.label}</span>
                          </div>
                          
                          <label className="relative inline-flex items-center cursor-pointer">
                             <input 
                               type="checkbox" 
                               checked={section.enabled} 
                               onChange={() => {
                                  const newSections = [...config.homeSections];
                                  newSections[index].enabled = !newSections[index].enabled;
                                  setConfig({ ...config, homeSections: newSections });
                               }} 
                               className="sr-only peer" 
                             />
                             <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Legacy Feature Toggles (Global) */}
              <h3 className="font-bold text-gray-800 text-lg mt-8">Global Feature Switches</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {Object.entries(config.features).map(([key, value]) => (
                    <div key={key} className={`p-4 rounded-lg border flex justify-between items-center ${value ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                       <div>
                          <h4 className="font-bold capitalize text-gray-800">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                          <p className="text-xs text-gray-500">{value ? 'Active' : 'Disabled'}</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={value as boolean} 
                            onChange={e => setConfig({...config, features: {...config.features, [key]: e.target.checked}})} 
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                       </label>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* --- SLIDER MANAGEMENT --- */}
        {activeTab === 'slider' && <SliderManager />}

        {/* --- POPUP MANAGEMENT --- */}
        {activeTab === 'popups' && <PopupManager />}

      </div>
    </div>
  );
};

// --- SUB COMPONENTS FOR TABS ---

const SliderManager = () => {
   const [slides, setSlides] = useState<Slide[]>([]);
   const [editSlide, setEditSlide] = useState<Partial<Slide>>({});
   const [isEditing, setIsEditing] = useState(false);
   const [imageLoading, setImageLoading] = useState(false);

   useEffect(() => {
      getSlides().then(setSlides);
   }, []);

   const handleSave = async () => {
      if(!editSlide.title) return alert("Title required");
      const newSlide = {
         ...editSlide,
         id: editSlide.id || undefined, 
         order: editSlide.order || slides.length + 1,
         isActive: editSlide.isActive ?? true
      } as Slide;

      await saveSlide(newSlide);
      setIsEditing(false);
      setEditSlide({});
      getSlides().then(setSlides);
   };

   const handleDelete = async (id: string) => {
      if(confirm("Delete slide?")) {
         await deleteSlide(id);
         getSlides().then(setSlides);
      }
   }

   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0]) {
         setImageLoading(true);
         try {
            const base64 = await compressAndConvertToBase64(e.target.files[0], 1200, 0.8);
            setEditSlide({...editSlide, imageUrl: base64});
         } finally {
            setImageLoading(false);
         }
      }
   }

   return (
      <div className="space-y-6">
         {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <div 
                  onClick={() => setIsEditing(true)} 
                  className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-gray-50"
               >
                  <i className="fas fa-plus text-3xl text-gray-400 mb-2"></i>
                  <span className="font-bold text-gray-500">Add New Slide</span>
               </div>
               {slides.map(slide => (
                  <div key={slide.id} className="bg-white border rounded-xl overflow-hidden shadow-sm group relative">
                     <div className="h-32 bg-gray-200">
                        {slide.imageUrl && <img src={slide.imageUrl} className="w-full h-full object-cover" />}
                     </div>
                     <div className="p-4">
                        <h4 className="font-bold text-gray-800">{slide.title}</h4>
                        <p className="text-xs text-gray-500 truncate">{slide.subtitle}</p>
                     </div>
                     <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => {setEditSlide(slide); setIsEditing(true)}} className="bg-white p-2 rounded-full shadow text-blue-600"><i className="fas fa-edit"></i></button>
                        <button onClick={() => handleDelete(slide.id)} className="bg-white p-2 rounded-full shadow text-red-600"><i className="fas fa-trash"></i></button>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="bg-gray-50 p-6 rounded-xl border">
               <h3 className="font-bold text-gray-800 mb-4">{editSlide.id ? 'Edit Slide' : 'New Slide'}</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                     <label className="block text-xs font-bold text-gray-700 mb-1">Slide Image</label>
                     <div className="flex items-center space-x-4 border-2 border-dashed border-gray-300 p-4 rounded bg-white">
                        <div className="w-32 h-20 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                           {imageLoading ? <i className="fas fa-spinner fa-spin text-blue-600"></i> : 
                            editSlide.imageUrl ? <img src={editSlide.imageUrl} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">No Image</span>}
                        </div>
                        <label className="cursor-pointer bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-700">
                           Upload
                           <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                        </label>
                     </div>
                  </div>
                  <div className="md:col-span-2">
                     <label className="block text-xs font-bold text-gray-700 mb-1">Title</label>
                     <input type="text" value={editSlide.title || ''} onChange={e => setEditSlide({...editSlide, title: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                  <div className="md:col-span-2">
                     <label className="block text-xs font-bold text-gray-700 mb-1">Subtitle</label>
                     <input type="text" value={editSlide.subtitle || ''} onChange={e => setEditSlide({...editSlide, subtitle: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">CTA Text</label>
                     <input type="text" value={editSlide.ctaText || ''} onChange={e => setEditSlide({...editSlide, ctaText: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">CTA Link</label>
                     <input type="text" value={editSlide.ctaLink || ''} onChange={e => setEditSlide({...editSlide, ctaLink: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
               </div>
               <div className="flex justify-end space-x-3 mt-6">
                  <button onClick={() => {setIsEditing(false); setEditSlide({});}} className="px-4 py-2 text-gray-600 font-bold">Cancel</button>
                  <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded font-bold">Save Slide</button>
               </div>
            </div>
         )}
      </div>
   )
}

const PopupManager = () => {
   const [popups, setPopups] = useState<Popup[]>([]);
   const [editPopup, setEditPopup] = useState<Partial<Popup>>({});
   const [isEditing, setIsEditing] = useState(false);
   const [imageLoading, setImageLoading] = useState(false);

   useEffect(() => { getPopups().then(setPopups); }, []);

   const handleSave = async () => {
      if(!editPopup.title) return alert("Title required");
      const newPopup = {
         ...editPopup,
         id: editPopup.id || undefined,
         isActive: editPopup.isActive ?? true,
         showOnce: editPopup.showOnce ?? true
      } as Popup;

      await savePopup(newPopup);
      setIsEditing(false);
      setEditPopup({});
      getPopups().then(setPopups);
   };

   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0]) {
         setImageLoading(true);
         try {
            const base64 = await compressAndConvertToBase64(e.target.files[0], 600, 0.8);
            setEditPopup({...editPopup, imageUrl: base64});
         } finally {
            setImageLoading(false);
         }
      }
   }

   return (
      <div className="space-y-6">
         {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <div 
                  onClick={() => setIsEditing(true)} 
                  className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-gray-50"
               >
                  <i className="fas fa-plus text-3xl text-gray-400 mb-2"></i>
                  <span className="font-bold text-gray-500">Create New Popup</span>
               </div>
               {popups.map(p => (
                  <div key={p.id} className="bg-white border rounded-xl p-4 shadow-sm relative group">
                     <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${p.type === 'exit' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{p.type}</span>
                        <span className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                     </div>
                     <h4 className="font-bold text-gray-800">{p.title}</h4>
                     <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.content}</p>
                     
                     <div className="absolute bottom-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => {setEditPopup(p); setIsEditing(true)}} className="text-blue-600"><i className="fas fa-edit"></i></button>
                        <button onClick={async () => { await deletePopup(p.id); getPopups().then(setPopups); }} className="text-red-600"><i className="fas fa-trash"></i></button>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="bg-gray-50 p-6 rounded-xl border">
               <h3 className="font-bold text-gray-800 mb-4">{editPopup.id ? 'Edit Popup' : 'New Popup'}</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
                     <select 
                       value={editPopup.type || 'promo'} 
                       onChange={e => setEditPopup({...editPopup, type: e.target.value as any})} 
                       className="w-full border p-2 rounded"
                     >
                        <option value="welcome">Welcome (Time Delay)</option>
                        <option value="promo">Promo / Discount</option>
                        <option value="alert">Alert / Notice</option>
                        <option value="exit">Exit Intent (Mouse Leave)</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">Trigger Delay (Sec)</label>
                     <input type="number" value={editPopup.triggerDelay || 0} onChange={e => setEditPopup({...editPopup, triggerDelay: Number(e.target.value)})} className="w-full border p-2 rounded" />
                  </div>
                  
                  {/* Popup Image Uploader */}
                  <div className="md:col-span-2">
                     <label className="block text-xs font-bold text-gray-700 mb-1">Popup Image (Optional)</label>
                     <div className="flex items-center space-x-4 border p-2 rounded bg-white">
                        <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                           {imageLoading ? <i className="fas fa-spinner fa-spin"></i> : 
                            editPopup.imageUrl ? <img src={editPopup.imageUrl} className="w-full h-full object-cover" /> : <i className="fas fa-image text-gray-300"></i>}
                        </div>
                        <input type="file" onChange={handleImageUpload} className="text-sm" accept="image/*" />
                     </div>
                  </div>

                  <div className="md:col-span-2">
                     <label className="block text-xs font-bold text-gray-700 mb-1">Title</label>
                     <input type="text" value={editPopup.title || ''} onChange={e => setEditPopup({...editPopup, title: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                  <div className="md:col-span-2">
                     <label className="block text-xs font-bold text-gray-700 mb-1">Content</label>
                     <textarea value={editPopup.content || ''} onChange={e => setEditPopup({...editPopup, content: e.target.value})} className="w-full border p-2 rounded h-24"></textarea>
                  </div>
                  <div className="md:col-span-2">
                     <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={editPopup.showOnce ?? true} onChange={e => setEditPopup({...editPopup, showOnce: e.target.checked})} />
                        <span className="text-sm">Show Only Once (Don't bug user)</span>
                     </label>
                  </div>
               </div>
               <div className="flex justify-end space-x-3 mt-6">
                  <button onClick={() => {setIsEditing(false); setEditPopup({});}} className="px-4 py-2 text-gray-600 font-bold">Cancel</button>
                  <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded font-bold">Save Popup</button>
               </div>
            </div>
         )}
      </div>
   )
}

export default AdminWebsiteControl;