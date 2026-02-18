import React, { useState, useEffect } from 'react';
import { DiscountCampaign, Coupon } from './types';
import { getAllCampaigns, saveCampaign, deleteCampaign, getCoupons, saveCoupon, deleteCoupon } from './api';

// Professional Image Compression (800px width for banners)
const compressAndConvertToBase64 = (file: File): Promise<string> => {
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
        const maxWidth = 800; // Banner size

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
            reject(new Error("Canvas failed"));
        }
      };
    };
    reader.onerror = reject;
  });
};

const AdminCampaigns = () => {
  const [activeTab, setActiveTab] = useState<'events' | 'coupons'>('events');
  const [campaigns, setCampaigns] = useState<DiscountCampaign[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  
  // Event Form State
  const [editingEvent, setEditingEvent] = useState<Partial<DiscountCampaign> | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Coupon Form State
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  const refreshData = async () => {
    const [camps, coups] = await Promise.all([getAllCampaigns(), getCoupons()]);
    setCampaigns(camps);
    setCoupons(coups);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageLoading(true);
      try {
        const base64 = await compressAndConvertToBase64(e.target.files[0]);
        setEditingEvent(prev => ({ ...prev, bannerUrl: base64 }));
      } catch (err) {
        alert("Image upload failed");
      } finally {
        setImageLoading(false);
      }
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent?.name) return;
    
    await saveCampaign({
      ...editingEvent,
      isActive: editingEvent.isActive ?? true,
      applicableCourses: editingEvent.applicableCourses || ['all'],
      startDate: new Date(editingEvent.startDate || Date.now()).getTime(),
      endDate: new Date(editingEvent.endDate || Date.now()).getTime()
    });
    
    setIsEventModalOpen(false);
    setEditingEvent(null);
    refreshData();
  };

  const handleDeleteEvent = async (id: string) => {
    if (confirm("Delete this campaign?")) {
      await deleteCampaign(id);
      refreshData();
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon?.code) return;

    await saveCoupon({
      ...editingCoupon,
      isActive: editingCoupon.isActive ?? true,
      expiryDate: new Date(editingCoupon.expiryDate || Date.now()).getTime(),
      usedCount: editingCoupon.usedCount || 0
    });

    setIsCouponModalOpen(false);
    setEditingCoupon(null);
    refreshData();
  };

  const handleDeleteCoupon = async (id: string) => {
    if (confirm("Delete this coupon?")) {
      await deleteCoupon(id);
      refreshData();
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setEditingCoupon(prev => ({ ...prev, code: result }));
  };

  return (
    <div className="space-y-6">
      
      {/* Tabs */}
      <div className="flex border-b overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('events')} className={`px-6 py-3 font-bold text-sm uppercase border-b-2 transition whitespace-nowrap ${activeTab === 'events' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Events & Sales</button>
        <button onClick={() => setActiveTab('coupons')} className={`px-6 py-3 font-bold text-sm uppercase border-b-2 transition whitespace-nowrap ${activeTab === 'coupons' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Coupons</button>
      </div>

      {/* --- EVENTS TAB --- */}
      {activeTab === 'events' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Active Campaigns</h3>
            <button onClick={() => {setEditingEvent({}); setIsEventModalOpen(true)}} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 text-sm md:text-base">+ Create Event</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(camp => (
              <div key={camp.id} className="bg-white border rounded-xl p-5 shadow-sm relative group overflow-hidden">
                {camp.bannerUrl && (
                  <div className="h-24 w-full mb-3 rounded-lg overflow-hidden relative">
                    <img src={camp.bannerUrl} className="w-full h-full object-cover" alt="Banner" />
                    <div className="absolute inset-0 bg-black/20"></div>
                  </div>
                )}
                <div className="flex justify-between items-start mb-2">
                   <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${camp.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                     {camp.isActive ? 'Active' : 'Inactive'}
                   </span>
                   <span className="text-xs text-gray-500">{new Date(camp.endDate).toLocaleDateString()}</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900">{camp.name}</h4>
                <p className="text-blue-600 font-bold text-2xl my-2">
                  {camp.type === 'percentage' ? `${camp.value}% OFF` : `৳${camp.value} OFF`}
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                   <p>Start: {new Date(camp.startDate).toLocaleString()}</p>
                   <p>End: {new Date(camp.endDate).toLocaleString()}</p>
                </div>
                
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition flex space-x-2">
                   <button onClick={() => {setEditingEvent(camp); setIsEventModalOpen(true)}} className="bg-white p-2 rounded-full shadow text-blue-600 hover:bg-blue-50"><i className="fas fa-edit"></i></button>
                   <button onClick={() => handleDeleteEvent(camp.id)} className="bg-white p-2 rounded-full shadow text-red-600 hover:bg-red-50"><i className="fas fa-trash"></i></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- COUPONS TAB --- */}
      {activeTab === 'coupons' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Coupon Codes</h3>
            <button onClick={() => {setEditingCoupon({}); setIsCouponModalOpen(true)}} className="bg-purple-600 text-white px-4 py-2 rounded font-bold hover:bg-purple-700 text-sm md:text-base">+ Create Coupon</button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden border">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Discount</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Usage</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Expiry</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {coupons.map(coupon => (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono font-bold text-blue-600">{coupon.code}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-700">
                          {coupon.type === 'percentage' ? `${coupon.value}%` : `৳${coupon.value}`}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {coupon.usedCount} / {coupon.usageLimit || '∞'}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {new Date(coupon.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => {setEditingCoupon(coupon); setIsCouponModalOpen(true)}} className="text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => handleDeleteCoupon(coupon.id)} className="text-red-600 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>
        </div>
      )}

      {/* --- EVENT MODAL --- */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh] animate-fade-in-up">
              <h3 className="text-xl font-bold mb-4 text-gray-800">{editingEvent?.id ? 'Edit Event' : 'New Event'}</h3>
              <form onSubmit={handleSaveEvent} className="space-y-4">
                 
                 {/* Banner Image */}
                 <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition relative">
                    {imageLoading ? <div className="text-blue-600 font-bold">Processing Image...</div> : 
                     editingEvent?.bannerUrl ? (
                       <img src={editingEvent.bannerUrl} className="w-full h-32 object-cover rounded shadow-sm" alt="Banner" />
                     ) : (
                       <div className="text-gray-400 py-4"><i className="fas fa-image text-2xl mb-2"></i><br/>Upload Banner Image</div>
                     )
                    }
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleBannerUpload} />
                 </div>

                 <input className="w-full border p-2 rounded" placeholder="Event Name (e.g. Eid Sale)" value={editingEvent?.name || ''} onChange={e => setEditingEvent({...editingEvent, name: e.target.value})} required />
                 
                 <div className="grid grid-cols-2 gap-4">
                    <select className="border p-2 rounded bg-white" value={editingEvent?.type || 'percentage'} onChange={e => setEditingEvent({...editingEvent, type: e.target.value as any})}>
                       <option value="percentage">Percentage (%)</option>
                       <option value="fixed">Fixed Amount (Tk)</option>
                    </select>
                    <input type="number" className="border p-2 rounded" placeholder="Value" value={editingEvent?.value || ''} onChange={e => setEditingEvent({...editingEvent, value: Number(e.target.value)})} required />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs font-bold block mb-1">Start Date</label>
                       <input type="date" className="border p-2 rounded w-full" value={editingEvent?.startDate ? new Date(editingEvent.startDate).toISOString().split('T')[0] : ''} onChange={e => setEditingEvent({...editingEvent, startDate: new Date(e.target.value).getTime()})} required />
                    </div>
                    <div>
                       <label className="text-xs font-bold block mb-1">End Date</label>
                       <input type="date" className="border p-2 rounded w-full" value={editingEvent?.endDate ? new Date(editingEvent.endDate).toISOString().split('T')[0] : ''} onChange={e => setEditingEvent({...editingEvent, endDate: new Date(e.target.value).getTime()})} required />
                    </div>
                 </div>
                 
                 <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={editingEvent?.isActive ?? true} onChange={e => setEditingEvent({...editingEvent, isActive: e.target.checked})} />
                    <label>Active</label>
                 </div>
                 
                 <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold">Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 shadow">Save Event</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* --- COUPON MODAL --- */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh] animate-fade-in-up">
              <h3 className="text-xl font-bold mb-4 text-gray-800">{editingCoupon?.id ? 'Edit Coupon' : 'New Coupon'}</h3>
              <form onSubmit={handleSaveCoupon} className="space-y-4">
                 <div className="flex space-x-2">
                    <input className="flex-grow border p-2 rounded uppercase font-mono" placeholder="CODE" value={editingCoupon?.code || ''} onChange={e => setEditingCoupon({...editingCoupon, code: e.target.value.toUpperCase()})} required />
                    <button type="button" onClick={generateRandomCode} className="bg-gray-200 px-3 rounded text-xs font-bold hover:bg-gray-300">Random</button>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <select className="border p-2 rounded bg-white" value={editingCoupon?.type || 'percentage'} onChange={e => setEditingCoupon({...editingCoupon, type: e.target.value as any})}>
                       <option value="percentage">Percentage (%)</option>
                       <option value="fixed">Fixed Amount (Tk)</option>
                    </select>
                    <input type="number" className="border p-2 rounded" placeholder="Value" value={editingCoupon?.value || ''} onChange={e => setEditingCoupon({...editingCoupon, value: Number(e.target.value)})} required />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <input type="number" className="border p-2 rounded" placeholder="Usage Limit (0 = Unlimited)" value={editingCoupon?.usageLimit || ''} onChange={e => setEditingCoupon({...editingCoupon, usageLimit: Number(e.target.value)})} />
                    <input type="number" className="border p-2 rounded" placeholder="Min Purchase (Tk)" value={editingCoupon?.minPurchase || ''} onChange={e => setEditingCoupon({...editingCoupon, minPurchase: Number(e.target.value)})} />
                 </div>
                 <div>
                    <label className="text-xs font-bold block mb-1">Expiry Date</label>
                    <input type="date" className="border p-2 rounded w-full" value={editingCoupon?.expiryDate ? new Date(editingCoupon.expiryDate).toISOString().split('T')[0] : ''} onChange={e => setEditingCoupon({...editingCoupon, expiryDate: new Date(e.target.value).getTime()})} required />
                 </div>
                 <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={editingCoupon?.isActive ?? true} onChange={e => setEditingCoupon({...editingCoupon, isActive: e.target.checked})} />
                    <label>Active</label>
                 </div>
                 <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={() => setIsCouponModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold">Cancel</button>
                    <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded font-bold hover:bg-purple-700 shadow">Save Coupon</button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default AdminCampaigns;