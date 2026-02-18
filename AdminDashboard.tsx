
import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminCourses from './AdminCourses';
import AdminNews from './AdminNews';
import AdminExams from './AdminExams';
import AdminUsers from './AdminUsers';
import AdminPayments from './AdminPayments';
import AdminWebsiteControl from './AdminWebsiteControl'; 
import AdminMedia from './AdminMedia';
import AdminCampaigns from './AdminCampaigns'; 
import AdminSounds from './AdminSounds'; 
import AdminAnalytics from './AdminAnalytics';
import AdminPolls from './AdminPolls';
import { subscribeToDashboardStats } from './api'; // UPDATED: Use subscription
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AdminDashboard = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'news' | 'exams' | 'users' | 'payments' | 'settings' | 'media' | 'analytics' | 'campaigns' | 'sounds' | 'polls'>('dashboard');
  const [stats, setStats] = useState({ totalUsers: 0, totalCourses: 0, totalExams: 0, totalRevenue: 0 });
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // REAL-TIME DASHBOARD STATS
  useEffect(() => {
    // This subscribe function returns an unsubscribe function
    const unsubscribe = subscribeToDashboardStats((data) => {
      setStats(data);
    });
    
    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, []);

  if (!userProfile || userProfile.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 font-sans p-4">
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl text-center max-w-md w-full border border-slate-100">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl md:text-3xl">
            <i className="fas fa-lock"></i>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">অ্যাক্সেস ডিনাইড</h2>
          <p className="text-slate-500 mb-8 leading-relaxed text-sm md:text-base">এই পেজটি শুধুমাত্র অ্যাডমিনদের জন্য সংরক্ষিত। আপনার কাছে এটি দেখার অনুমতি নেই।</p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition transform hover:-translate-y-1 shadow-lg text-sm md:text-base"
          >
            হোম পেজে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  const revenueData = [
    { name: 'Jan', revenue: 45000, users: 120 },
    { name: 'Feb', revenue: 52000, users: 150 },
    { name: 'Mar', revenue: 48000, users: 180 },
    { name: 'Apr', revenue: 61000, users: 220 },
    { name: 'May', revenue: 55000, users: 250 },
    { name: 'Jun', revenue: 67000, users: 310 },
    { name: 'Jul', revenue: 72000, users: 380 },
  ];

  const SidebarItem = ({ id, icon, label }: { id: typeof activeTab, icon: string, label: string }) => (
    <button 
      onClick={() => { setActiveTab(id); setIsMobileSidebarOpen(false); }} 
      title={isSidebarCollapsed ? label : ''}
      className={`relative w-full flex items-center px-3 py-3 my-1 rounded-xl transition-all duration-200 group ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      } ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}
    >
      <i className={`fas ${icon} ${isSidebarCollapsed ? 'text-lg' : 'text-base w-6 text-center'}`}></i>
      
      {!isSidebarCollapsed && (
        <span className="font-medium text-sm tracking-wide">{label}</span>
      )}
      
      {activeTab === id && !isSidebarCollapsed && (
        <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      <aside 
        className={`fixed md:static inset-y-0 left-0 z-40 bg-slate-900 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800 shadow-2xl md:shadow-none
          ${isMobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'} 
          ${isSidebarCollapsed ? 'md:w-20' : 'md:w-72'}
        `}
      >
        <div className="h-16 md:h-20 flex items-center justify-center border-b border-slate-800 relative">
          <div className={`flex items-center transition-all duration-300 ${isSidebarCollapsed ? 'space-x-0' : 'space-x-3'}`}>
             <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg shadow-blue-900/50">BK</div>
             {!isSidebarCollapsed && (
               <div className="animate-fade-in">
                  <h1 className="text-white font-bold text-lg tracking-tight">BK <span className="text-blue-500">Admin</span></h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise</p>
               </div>
             )}
          </div>
          <button onClick={() => setIsMobileSidebarOpen(false)} className="absolute right-4 text-slate-400 hover:text-white md:hidden"><i className="fas fa-times text-lg"></i></button>
        </div>

        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:flex absolute -right-3 top-24 w-6 h-6 bg-blue-600 text-white rounded-full items-center justify-center text-xs shadow-lg hover:bg-blue-50 transition border-2 border-slate-50 z-50"><i className={`fas fa-chevron-${isSidebarCollapsed ? 'right' : 'left'}`}></i></button>

        <nav className="flex-grow p-4 overflow-y-auto custom-scrollbar space-y-4 md:space-y-6">
          <div>
             {!isSidebarCollapsed && <p className="text-[10px] font-bold text-slate-500 uppercase px-4 mb-2 tracking-wider">Analytics</p>}
             <SidebarItem id="dashboard" icon="fa-chart-line" label="Overview" />
             <SidebarItem id="analytics" icon="fa-chart-pie" label="Advanced Analytics" />
          </div>
          <div>
             {!isSidebarCollapsed && <p className="text-[10px] font-bold text-slate-500 uppercase px-4 mb-2 tracking-wider">Content</p>}
             <SidebarItem id="courses" icon="fa-layer-group" label="Courses" />
             <SidebarItem id="exams" icon="fa-clipboard-check" label="Exams & Quizzes" />
             <SidebarItem id="news" icon="fa-newspaper" label="News & Blog" />
             <SidebarItem id="media" icon="fa-photo-video" label="Media Gallery" />
             <SidebarItem id="polls" icon="fa-poll" label="Voting & Polls" />
          </div>
          <div>
             {!isSidebarCollapsed && <p className="text-[10px] font-bold text-slate-500 uppercase px-4 mb-2 tracking-wider">Marketing</p>}
             <SidebarItem id="campaigns" icon="fa-tags" label="Events & Discounts" />
          </div>
          <div>
             {!isSidebarCollapsed && <p className="text-[10px] font-bold text-slate-500 uppercase px-4 mb-2 tracking-wider">System</p>}
             <SidebarItem id="users" icon="fa-users-cog" label="Users & Roles" />
             <SidebarItem id="payments" icon="fa-wallet" label="Finance" />
             <SidebarItem id="settings" icon="fa-sliders-h" label="Website Control" />
             <SidebarItem id="sounds" icon="fa-volume-up" label="Sound Effects" />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900 mb-safe">
           <button onClick={() => navigate('/')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3 px-4'} py-3 text-red-400 hover:bg-slate-800 rounded-xl transition group`} title="Exit Admin Panel">
             <i className="fas fa-sign-out-alt text-lg group-hover:text-red-500 transition"></i>
             {!isSidebarCollapsed && <span className="font-bold text-sm">Exit Panel</span>}
           </button>
        </div>
      </aside>

      <div className="flex-grow flex flex-col overflow-hidden relative w-full">
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-20 shadow-sm flex-shrink-0">
           <div className="flex items-center space-x-4">
              <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden text-slate-600 hover:text-blue-600 p-1"><i className="fas fa-bars text-xl"></i></button>
              <h2 className="text-lg md:text-xl font-bold text-slate-800 capitalize truncate max-w-[150px] md:max-w-none">{activeTab}</h2>
              <div className="relative hidden lg:block ml-4">
                 <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                 <input type="text" placeholder="Quick search..." className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition w-64" />
              </div>
           </div>
           <div className="flex items-center space-x-3 md:space-x-5">
              <div className="hidden md:flex flex-col text-right">
                 <p className="text-xs font-bold text-slate-400 uppercase">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              </div>
              <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
              <button className="relative p-2 text-slate-400 hover:text-blue-600 transition"><i className="far fa-bell text-lg md:text-xl"></i><span className="absolute top-1 right-1 w-2 md:w-2.5 h-2 md:h-2.5 bg-red-500 border-2 border-white rounded-full"></span></button>
              <div className="flex items-center space-x-2 md:space-x-3 pl-1 md:pl-2 cursor-pointer hover:opacity-80 transition">
                 <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-slate-800">{userProfile.displayName}</p>
                    <p className="text-xs text-blue-600 font-bold">Admin</p>
                 </div>
                 <img src={userProfile.photoURL || 'https://via.placeholder.com/40'} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-blue-100 object-cover" alt="Admin" />
              </div>
           </div>
        </header>

        <main className="flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-50 w-full">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 md:space-y-8 animate-fade-in-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { title: 'Total Users', value: stats.totalUsers, icon: 'fa-users', color: 'blue', increase: '+Live' },
                  { title: 'Total Revenue', value: `৳ ${(stats.totalRevenue).toLocaleString()}`, icon: 'fa-wallet', color: 'green', increase: '+Live' },
                  { title: 'Active Courses', value: stats.totalCourses, icon: 'fa-book-open', color: 'purple', increase: '' },
                  { title: 'Live Exams', value: stats.totalExams, icon: 'fa-clock', color: 'orange', increase: '' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.title}</p>
                           <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mt-2">{item.value}</h3>
                           {item.increase && (
                             <p className={`text-[10px] md:text-xs font-bold mt-2 text-green-500 animate-pulse`}>
                               <i className="fas fa-circle text-[8px] mr-1"></i> {item.increase}
                             </p>
                           )}
                        </div>
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-lg md:text-xl bg-${item.color}-50 text-${item.color}-500`}><i className={`fas ${item.icon}`}></i></div>
                     </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="text-base md:text-lg font-bold text-slate-800">Revenue Analytics</h3>
                       <select className="bg-slate-50 border-none text-xs font-bold text-slate-500 rounded-lg px-3 py-1 outline-none"><option>This Year</option><option>Last Year</option></select>
                    </div>
                    <div className="h-64 md:h-80 w-full" style={{ width: '100%', minHeight: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={300}>
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                          <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
                 <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-base md:text-lg font-bold text-slate-800 mb-6">User Growth</h3>
                    <div className="h-64 md:h-80 w-full" style={{ width: '100%', minHeight: '300px' }}>
                       <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={300}>
                          <BarChart data={revenueData}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                             <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                             <Bar dataKey="users" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={30} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && <AdminAnalytics />}
          {activeTab === 'courses' && <AdminCourses />}
          {activeTab === 'news' && <AdminNews />}
          {activeTab === 'exams' && <AdminExams />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'payments' && <AdminPayments />}
          {activeTab === 'settings' && <AdminWebsiteControl />}
          {activeTab === 'media' && <AdminMedia />}
          {activeTab === 'campaigns' && <AdminCampaigns />}
          {activeTab === 'sounds' && <AdminSounds />}
          {activeTab === 'polls' && <AdminPolls />} 

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
