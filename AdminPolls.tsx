
import React, { useState, useEffect } from 'react';
import { Poll } from './types';
import { createPoll, closePoll, deletePoll, subscribeToPolls } from './api';
import { useAuth } from './AuthContext';

const AdminPolls = () => {
  const { userProfile } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [days, setDays] = useState(7);

  useEffect(() => {
    const unsub = subscribeToPolls(setPolls);
    return () => unsub();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || options.some(o => !o)) return alert("Fill all fields");

    await createPoll({
      title,
      description: desc,
      options: options.map((txt, idx) => ({ id: idx.toString(), text: txt, voteCount: 0 })),
      totalVotes: 0,
      isActive: true,
      createdAt: Date.now(),
      createdBy: userProfile?.uid || 'admin',
      expiryDate: Date.now() + (days * 24 * 60 * 60 * 1000)
    });

    setShowCreate(false);
    setTitle(''); setDesc(''); setOptions(['', '']);
  };

  const addOption = () => setOptions([...options, '']);
  const updateOption = (idx: number, val: string) => {
    const newOpts = [...options];
    newOpts[idx] = val;
    setOptions(newOpts);
  };

  return (
    <div className="space-y-8">
       <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Poll Management</h2>
          <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">
             {showCreate ? 'Cancel' : '+ Create Poll'}
          </button>
       </div>

       {showCreate && (
          <div className="bg-white p-6 rounded-xl shadow border animate-fade-in">
             <h3 className="font-bold mb-4">Create New Poll</h3>
             <form onSubmit={handleCreate} className="space-y-4">
                <input className="w-full border p-2 rounded" placeholder="Question Title" value={title} onChange={e => setTitle(e.target.value)} required />
                <textarea className="w-full border p-2 rounded" placeholder="Description (Optional)" value={desc} onChange={e => setDesc(e.target.value)} />
                
                <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-gray-500">Options</label>
                   {options.map((opt, idx) => (
                      <input key={idx} className="w-full border p-2 rounded" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => updateOption(idx, e.target.value)} required />
                   ))}
                   <button type="button" onClick={addOption} className="text-blue-600 text-sm font-bold">+ Add Option</button>
                </div>

                <div>
                   <label className="text-xs font-bold uppercase text-gray-500">Duration (Days)</label>
                   <input type="number" className="w-full border p-2 rounded" value={days} onChange={e => setDays(Number(e.target.value))} />
                </div>

                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-bold">Launch Poll</button>
             </form>
          </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {polls.map(poll => (
             <div key={poll.id} className="bg-white p-5 rounded-xl border shadow-sm relative">
                <div className="flex justify-between items-start mb-2">
                   <span className={`px-2 py-1 text-xs font-bold rounded ${poll.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {poll.isActive ? 'Active' : 'Closed'}
                   </span>
                   <button onClick={() => deletePoll(poll.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><i className="fas fa-trash"></i></button>
                </div>
                <h4 className="font-bold text-gray-800">{poll.title}</h4>
                <div className="mt-4 space-y-2">
                   {poll.options.map(opt => (
                      <div key={opt.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                         <span>{opt.text}</span>
                         <span className="font-bold">{opt.voteCount} ({poll.totalVotes > 0 ? Math.round((opt.voteCount/poll.totalVotes)*100) : 0}%)</span>
                      </div>
                   ))}
                </div>
                <div className="mt-4 flex justify-between items-center">
                   <span className="text-xs text-gray-500">Total: {poll.totalVotes}</span>
                   {poll.isActive && (
                      <button onClick={() => closePoll(poll.id)} className="text-orange-600 text-xs font-bold border border-orange-200 px-2 py-1 rounded hover:bg-orange-50">Close Voting</button>
                   )}
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};

export default AdminPolls;
