import React, { useState, useEffect } from 'react';
import { getFAQs, addFAQ, deleteFAQ, toggleFAQHelpful } from './api';
import { FAQ as FAQType, UserRole } from './types';
import { useAuth } from './AuthContext';

const FAQ = () => {
  const { userProfile } = useAuth();
  const [faqs, setFaqs] = useState<FAQType[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Admin State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [newCat, setNewCat] = useState('General');

  useEffect(() => {
    document.title = "FAQs - BK Academy";
    refreshFAQs();
  }, []);

  const refreshFAQs = async () => {
    const data = await getFAQs();
    setFaqs(data);
  };

  const handleToggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const handleHelpful = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await toggleFAQHelpful(id);
    refreshFAQs(); // Refresh to show new count
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ || !newA) return;
    await addFAQ({
        category: newCat as any,
        question: newQ,
        answer: newA
    });
    setNewQ(''); setNewA(''); setShowAddForm(false);
    refreshFAQs();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this FAQ?")) {
        await deleteFAQ(id);
        refreshFAQs();
    }
  };

  // Filter Logic
  const categories = ['All', 'General', 'Payment', 'Course', 'Exam', 'Account'];
  const filteredFaqs = faqs.filter(f => {
    const matchCat = activeCategory === 'All' || f.category === activeCategory;
    const matchSearch = f.question.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const isAdmin = userProfile?.role === UserRole.ADMIN;

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQs)</h1>
        <p className="text-gray-500">আপনার মনের প্রশ্নের উত্তর এখানে খুঁজুন</p>
        
        <div className="relative max-w-xl mx-auto">
           <input 
             type="text" 
             placeholder="কী জানতে চান? (যেমন: পেমেন্ট, সার্টিফিকেট)" 
             className="w-full border border-gray-300 rounded-full py-3 px-6 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
           <i className="fas fa-search absolute left-5 top-4 text-gray-400"></i>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap justify-center gap-2">
         {categories.map(cat => (
             <button
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={`px-4 py-2 rounded-full text-sm font-bold transition ${activeCategory === cat ? 'bg-blue-600 text-white shadow-lg transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
             >
               {cat}
             </button>
         ))}
      </div>

      {/* Admin Add Button */}
      {isAdmin && (
         <div className="text-center">
            <button onClick={() => setShowAddForm(!showAddForm)} className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm">
                {showAddForm ? 'Cancel' : '+ Add New FAQ'}
            </button>
            
            {showAddForm && (
                <form onSubmit={handleAdd} className="mt-4 bg-gray-50 p-6 rounded-lg border text-left space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Question</label>
                        <input className="w-full border p-2 rounded" value={newQ} onChange={e => setNewQ(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Answer</label>
                        <textarea className="w-full border p-2 rounded" value={newA} onChange={e => setNewA(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Category</label>
                        <select className="w-full border p-2 rounded" value={newCat} onChange={e => setNewCat(e.target.value)}>
                            {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-bold">Save</button>
                </form>
            )}
         </div>
      )}

      {/* Accordion List */}
      <div className="space-y-4">
         {filteredFaqs.length === 0 && <p className="text-center text-gray-500 py-10">কোনো প্রশ্ন পাওয়া যায়নি।</p>}
         
         {filteredFaqs.map(faq => (
             <div key={faq.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                <button 
                  onClick={() => handleToggle(faq.id)}
                  className="w-full flex justify-between items-center p-5 text-left focus:outline-none"
                >
                   <span className="font-bold text-gray-800 text-lg">{faq.question}</span>
                   <i className={`fas fa-chevron-down transition-transform duration-300 text-gray-400 ${openId === faq.id ? 'transform rotate-180' : ''}`}></i>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openId === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-5 pt-0 text-gray-600 border-t border-gray-100 bg-gray-50">
                        <p className="mb-4">{faq.answer}</p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                             <div className="flex space-x-4">
                                <span>{faq.views} views</span>
                                <button onClick={(e) => handleHelpful(e, faq.id)} className="hover:text-blue-600 flex items-center space-x-1">
                                    <i className="far fa-thumbs-up"></i> <span>Helpful ({faq.helpfulCount})</span>
                                </button>
                             </div>
                             {isAdmin && (
                                 <button onClick={(e) => handleDelete(e, faq.id)} className="text-red-500 font-bold hover:underline">Delete</button>
                             )}
                        </div>
                    </div>
                </div>
             </div>
         ))}
      </div>
    </div>
  );
};

export default FAQ;