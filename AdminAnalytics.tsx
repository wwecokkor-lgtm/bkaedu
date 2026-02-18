
import React, { useState, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { subscribeToAdvancedAnalytics, generateAIAnalyticsInsight } from './api'; // UPDATED
import { useAuth } from './AuthContext';

// --- COMPONENTS ---

const KpiCard = ({ title, value, change, icon, color, loading }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-slate-100 animate-pulse rounded"></div>
        ) : (
          <h3 className="text-3xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{value}</h3>
        )}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color} bg-opacity-10 text-opacity-100`}>
        <i className={`fas ${icon} ${color.replace('bg-', 'text-')}`}></i>
      </div>
    </div>
    <div className="mt-4 flex items-center text-xs font-bold">
      <span className={`${change >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
        <i className={`fas fa-arrow-${change >= 0 ? 'up' : 'down'} mr-1`}></i> {Math.abs(change)}%
      </span>
      <span className="text-slate-400 ml-2">vs last period</span>
    </div>
  </div>
);

const ChartContainer = ({ title, children, action }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
    <div className="flex justify-between items-center mb-6">
      <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
      {action}
    </div>
    <div className="flex-grow w-full relative" style={{ width: '100%', minHeight: '300px', height: '300px' }}>{children}</div>
  </div>
);

const AdminAnalytics = () => {
  const { userProfile } = useAuth();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [data, setData] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'revenue' | 'exams'>('overview');

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToAdvancedAnalytics(dateRange, (newData) => {
        setData(newData);
    });
    return () => unsubscribe();
  }, [dateRange]);

  const handleGenerateInsight = async () => {
    if (!data) return;
    setAiLoading(true);
    try {
      const insight = await generateAIAnalyticsInsight(data);
      setAiInsight(insight);
    } catch (e) {
      setAiInsight("AI Analysis failed. Please try again later.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleExport = () => {
    alert("Report (PDF/Excel) downloading... (Feature simulated)");
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-500 text-sm font-bold">Connecting to Live Data Stream...</p>
        </div>
      </div>
    );
  }

  // Colors
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm sticky top-0 z-20">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {['overview', 'users', 'revenue', 'exams'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition ${
                activeTab === tab 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 3 Months</option>
          </select>
          
          <button 
            onClick={handleExport}
            className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition"
            title="Export Report"
          >
            <i className="fas fa-download"></i>
          </button>
        </div>
      </div>

      {/* 2. Realtime Pulse Bar */}
      <div className="bg-slate-900 text-white p-3 rounded-xl flex flex-wrap justify-between items-center text-xs font-bold shadow-lg shadow-blue-900/20">
         <div className="flex items-center space-x-6 px-4">
            <span className="flex items-center text-green-400">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
               System Live
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="flex items-center">
               <i className="fas fa-users mr-2 text-blue-400"></i> {data.live.activeUsers} Active Users
            </span>
            <span className="flex items-center">
               <i className="fas fa-book-reader mr-2 text-purple-400"></i> {data.live.lessonViewers} Learning Now
            </span>
         </div>
         <div className="px-4 text-slate-400">
            Server Response: <span className="text-white">{data.live.latency}ms</span>
         </div>
      </div>

      {/* 3. AI Insight Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
         <div className="relative z-10">
            <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-xl font-bold flex items-center">
                     <i className="fas fa-robot mr-2 text-yellow-300"></i> AI Growth Consultant
                  </h3>
                  <p className="text-indigo-100 text-sm mt-1 max-w-2xl">
                     {aiInsight || "Click the button to generate an AI-powered analysis of your current performance metrics, revenue trends, and student retention risks."}
                  </p>
               </div>
               <button 
                 onClick={handleGenerateInsight} 
                 disabled={aiLoading}
                 className="bg-white text-indigo-700 px-5 py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-indigo-50 transition flex items-center"
               >
                 {aiLoading ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : <i className="fas fa-magic mr-2"></i>}
                 {aiInsight ? 'Regenerate' : 'Analyze Data'}
               </button>
            </div>
         </div>
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard title="Total Revenue" value={`৳${data.overview.totalRevenue.toLocaleString()}`} change={data.overview.revenueGrowth} icon="fa-wallet" color="bg-green-500" />
            <KpiCard title="Total Students" value={data.overview.totalStudents.toLocaleString()} change={data.overview.studentGrowth} icon="fa-user-graduate" color="bg-blue-500" />
            <KpiCard title="Course Sales" value={data.overview.totalEnrollments} change={12.5} icon="fa-shopping-cart" color="bg-purple-500" />
            <KpiCard title="Exams Taken" value={data.overview.totalExams} change={5.2} icon="fa-file-signature" color="bg-orange-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
             {/* Revenue Trend */}
             <div className="lg:col-span-2 h-full">
                <ChartContainer title="Revenue & Growth Trend">
                   <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={300}>
                      <AreaChart data={data.charts.revenueTrend}>
                         <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                               <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                         <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                         <Tooltip contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                         <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </ChartContainer>
             </div>

             {/* Device Usage */}
             <div className="h-full">
                <ChartContainer title="Device Breakdown">
                   <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={300}>
                      <PieChart>
                         <Pie 
                           data={data.charts.deviceUsage} 
                           cx="50%" cy="50%" 
                           innerRadius={60} 
                           outerRadius={80} 
                           paddingAngle={5} 
                           dataKey="value"
                         >
                           {data.charts.deviceUsage.map((entry: any, index: number) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                         </Pie>
                         <Tooltip />
                         <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                   </ResponsiveContainer>
                </ChartContainer>
             </div>
          </div>
        </>
      )}

      {/* --- USERS TAB --- */}
      {activeTab === 'users' && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer title="User Growth (Monthly)">
               <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0} debounce={300}>
                  <BarChart data={data.charts.userGrowth}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                     <Tooltip cursor={{fill: '#f8fafc'}} />
                     <Bar dataKey="students" stackId="a" fill="#2563eb" radius={[0, 0, 4, 4]} />
                     <Bar dataKey="teachers" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer title="Student Distribution by Class">
               <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0} debounce={300}>
                  <BarChart layout="vertical" data={data.charts.classDistribution}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 12}} />
                     <Tooltip />
                     <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
            </ChartContainer>
         </div>
      )}

      {/* --- REVENUE TAB --- */}
      {activeTab === 'revenue' && (
         <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2">
                  <ChartContainer title="Revenue Source (Coming Soon)">
                     <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0} debounce={300}>
                        <BarChart data={data.charts.revenueByCourse}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                           <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                           <Tooltip />
                           <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  </ChartContainer>
               </div>
               <div>
                  <ChartContainer title="Payment Methods">
                     <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0} debounce={300}>
                        <PieChart>
                           <Pie data={data.charts.paymentMethods} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                              {data.charts.paymentMethods.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                           </Pie>
                           <Tooltip />
                        </PieChart>
                     </ResponsiveContainer>
                  </ChartContainer>
               </div>
            </div>
         </div>
      )}

      {/* --- EXAMS TAB --- */}
      {activeTab === 'exams' && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer title="Performance Radar (Class Avg)">
               <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0} debounce={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.charts.examPerformance}>
                     <PolarGrid stroke="#e2e8f0" />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                     <PolarRadiusAxis angle={30} domain={[0, 100]} />
                     <Radar name="Class 10" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                     <Radar name="Class 9" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                     <Legend />
                     <Tooltip />
                  </RadarChart>
               </ResponsiveContainer>
            </ChartContainer>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <h3 className="font-bold text-slate-800 mb-4">Top Performers Leaderboard</h3>
               <div className="overflow-y-auto max-h-[250px] custom-scrollbar">
                  <table className="w-full text-sm text-left text-slate-600">
                     <thead className="text-xs text-slate-400 uppercase bg-slate-50 sticky top-0">
                        <tr>
                           <th className="px-4 py-3">Rank</th>
                           <th className="px-4 py-3">Student</th>
                           <th className="px-4 py-3">Avg Score</th>
                        </tr>
                     </thead>
                     <tbody>
                        {[1,2,3,4,5].map((i) => (
                           <tr key={i} className="border-b last:border-0 hover:bg-slate-50 transition">
                              <td className="px-4 py-3 font-bold text-blue-600">#{i}</td>
                              <td className="px-4 py-3">Student {i}</td>
                              <td className="px-4 py-3 font-bold">{98 - i}%</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default AdminAnalytics;
