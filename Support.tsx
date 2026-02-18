import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { SupportTicket } from './types';
import { submitTicket, getUserTickets } from './api';
import { Link } from 'react-router-dom';

const Support = () => {
  const { userProfile } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [view, setView] = useState<'home' | 'create' | 'list'>('home');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('Account');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Support Center - BK Academy";
    if (userProfile) {
        getUserTickets(userProfile.uid).then(setTickets);
    }
  }, [userProfile, view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return alert("Please login first");
    
    setLoading(true);
    await submitTicket({
        userId: userProfile.uid,
        userEmail: userProfile.email,
        subject,
        message,
        category,
        priority
    });
    setLoading(false);
    alert("টিকেট জমা দেওয়া হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।");
    setView('list');
    setSubject('');
    setMessage('');
  };

  const categories = [
    { name: 'Account Issues', icon: 'fa-user-lock', desc: 'Login, Password, Profile' },
    { name: 'Payment Issues', icon: 'fa-credit-card', desc: 'Refunds, Failed Payments' },
    { name: 'Course Access', icon: 'fa-book-reader', desc: 'Videos not playing, Materials' },
    { name: 'Exam & Certificates', icon: 'fa-certificate', desc: 'Results, Download Issues' },
  ];

  return (
    <div className="space-y-10 font-sans">
      {/* Hero Search */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-10 text-center text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
           <h1 className="text-4xl font-bold mb-4">কীভাবে সাহায্য করতে পারি?</h1>
           <div className="relative">
             <input 
               type="text" 
               placeholder="আপনার সমস্যা বা প্রশ্ন লিখুন..." 
               className="w-full py-4 px-6 rounded-full text-gray-800 focus:outline-none shadow-lg text-lg"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
             <button className="absolute right-2 top-2 bg-blue-600 p-2 rounded-full w-10 h-10 flex items-center justify-center hover:bg-blue-700 transition">
               <i className="fas fa-search"></i>
             </button>
           </div>
        </div>
      </div>

      {/* Content Area */}
      {view === 'home' && (
        <>
            {/* Quick Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((cat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer text-center group">
                        <div className="w-14 h-14 mx-auto bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition">
                            <i className={`fas ${cat.icon}`}></i>
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg">{cat.name}</h3>
                        <p className="text-gray-500 text-sm mt-2">{cat.desc}</p>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-white p-8 rounded-xl shadow border border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">সরাসরি কথা বলুন</h3>
                        <p className="text-gray-500 mb-4">আমাদের সাপোর্ট টিম সর্বদা প্রস্তুত।</p>
                        <button onClick={() => setView('create')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">
                            টিকেট জমা দিন
                        </button>
                    </div>
                    <i className="fas fa-headset text-6xl text-gray-200"></i>
                </div>
                
                {userProfile && (
                    <div className="flex-1 bg-white p-8 rounded-xl shadow border border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">আমার টিকেটসমূহ</h3>
                            <p className="text-gray-500 mb-4">পূর্ববর্তী টিকেটের স্ট্যাটাস দেখুন।</p>
                            <button onClick={() => setView('list')} className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-50">
                                টিকেট লিস্ট
                            </button>
                        </div>
                        <i className="fas fa-history text-6xl text-gray-200"></i>
                    </div>
                )}
            </div>

            {/* Common Links */}
            <div className="bg-gray-50 p-6 rounded-xl text-center">
                <p className="text-gray-600 mb-2">দ্রুত সমাধানের জন্য <Link to="/faqs" className="text-blue-600 font-bold hover:underline">FAQs</Link> দেখুন।</p>
            </div>
        </>
      )}

      {view === 'create' && (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow border border-gray-100 animate-fade-in-up">
            <button onClick={() => setView('home')} className="text-gray-500 hover:text-blue-600 mb-6 flex items-center">
                <i className="fas fa-arrow-left mr-2"></i> ফিরে যান
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">নতুন টিকেট খুলুন</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">সমস্যার ধরণ</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border p-3 rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500">
                        {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        <option value="Other">Other</option>
                    </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">প্রায়োরিটি</label>
                        <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full border p-3 rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">বিষয় (Subject)</label>
                    <input 
                        type="text" 
                        required 
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        className="w-full border p-3 rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="সংক্ষেপে সমস্যাটি লিখুন"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">বিস্তারিত বিবরণ</label>
                    <textarea 
                        required 
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        className="w-full border p-3 rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 h-32"
                        placeholder="বিস্তারিত লিখুন..."
                    ></textarea>
                </div>

                <div className="border-t pt-6">
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg">
                        {loading ? 'জমা দেওয়া হচ্ছে...' : 'টিকেট সাবমিট করুন'}
                    </button>
                </div>
            </form>
        </div>
      )}

      {view === 'list' && (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => setView('home')} className="text-gray-500 hover:text-blue-600 flex items-center">
                    <i className="fas fa-arrow-left mr-2"></i> ড্যাশবোর্ড
                </button>
                <button onClick={() => setView('create')} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm">
                    + নতুন টিকেট
                </button>
            </div>
            
            <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tickets.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">আপনার কোনো টিকেট নেই।</td></tr>
                        ) : (
                            tickets.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-gray-900">{ticket.subject}</div>
                                        <div className="text-xs text-gray-500">ID: #{ticket.id.slice(0,6)}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{ticket.category}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                            ticket.status === 'Open' ? 'bg-green-100 text-green-800' :
                                            ticket.status === 'Closed' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};

export default Support;