import React, { useState, useEffect } from 'react';
import { PaymentRequest, PaymentMethod } from './types';
import { getPaymentRequests, processPayment, getPaymentMethods, savePaymentMethod } from './api';

const AdminPayments = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'methods' | 'analytics'>('requests');
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending'); // all, pending, approved, rejected

  // Detail Modal State
  const [selectedReq, setSelectedReq] = useState<PaymentRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');

  // Method Edit State
  const [editMethod, setEditMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'requests') {
      const data = await getPaymentRequests();
      setRequests(data);
    } else if (activeTab === 'methods') {
      const data = await getPaymentMethods();
      setMethods(data);
    }
    setLoading(false);
  };

  // --- REQUEST HANDLERS ---
  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!selectedReq) return;
    if (!confirm(`Are you sure you want to ${status.toUpperCase()} this payment?`)) return;

    await processPayment(selectedReq.id, status, adminNote);
    setSelectedReq(null);
    setAdminNote('');
    fetchData(); // Refresh
  };

  const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);

  // --- SETTINGS HANDLERS ---
  const handleSaveMethod = async () => {
    if (editMethod) {
      await savePaymentMethod(editMethod);
      setEditMethod(null);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation */}
      <div className="flex border-b overflow-x-auto no-scrollbar">
        {['requests', 'methods', 'analytics'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 font-bold text-sm uppercase transition whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* --- TAB: REQUESTS --- */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden border">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">User / Course</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Payment Info</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map(req => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">{req.userName}</div>
                          <div className="text-xs text-gray-500">{req.userPhone}</div>
                          <div className="text-xs text-blue-600 font-medium mt-1 truncate max-w-[150px]">{req.courseTitle}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-bold">৳ {req.amount}</div>
                          <div className="text-xs text-gray-500">{req.paymentMethod} • <span className="font-mono">{req.transactionId}</span></div>
                          <div className="text-[10px] text-gray-400">{new Date(req.submittedAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            req.status === 'approved' ? 'bg-green-100 text-green-700' : 
                            req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setSelectedReq(req)} 
                            className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm font-bold hover:bg-blue-100"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredRequests.length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-500">No requests found.</td></tr>
                    )}
                  </tbody>
                </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: METHODS --- */}
      {activeTab === 'methods' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {methods.map(method => (
            <div key={method.id} className="bg-white p-6 rounded-lg shadow border flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{method.methodName}</h3>
                <p className="text-gray-600 font-mono text-xl my-2">{method.accountNumber}</p>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">{method.accountType}</span>
                <p className="text-xs text-gray-500 mt-3">{method.instructions}</p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={method.isEnabled} 
                    onChange={async (e) => {
                      await savePaymentMethod({ ...method, isEnabled: e.target.checked });
                      fetchData();
                    }}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
                <button 
                  onClick={() => setEditMethod(method)} 
                  className="text-blue-600 text-sm font-bold hover:underline"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- TAB: ANALYTICS --- */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-lg shadow border border-l-4 border-l-green-500">
              <h4 className="text-gray-500 text-xs font-bold uppercase">Total Revenue</h4>
              <p className="text-3xl font-bold text-gray-800 mt-2">৳ {requests.filter(r => r.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0)}</p>
           </div>
           <div className="bg-white p-6 rounded-lg shadow border border-l-4 border-l-yellow-500">
              <h4 className="text-gray-500 text-xs font-bold uppercase">Pending Amount</h4>
              <p className="text-3xl font-bold text-gray-800 mt-2">৳ {requests.filter(r => r.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0)}</p>
           </div>
           <div className="bg-white p-6 rounded-lg shadow border border-l-4 border-l-blue-500">
              <h4 className="text-gray-500 text-xs font-bold uppercase">Total Enrollments</h4>
              <p className="text-3xl font-bold text-gray-800 mt-2">{requests.filter(r => r.status === 'approved').length}</p>
           </div>
        </div>
      )}

      {/* REQUEST DETAIL MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={() => setSelectedReq(null)}></div>
          <div className="bg-white rounded-lg shadow-xl z-10 w-full max-w-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-none overflow-y-auto">
             
             {/* Image Side */}
             <div className="w-full md:w-1/2 bg-black flex items-center justify-center p-4">
                <img src={selectedReq.screenshotUrl} alt="Proof" className="max-h-[300px] md:max-h-[400px] object-contain" />
             </div>

             {/* Info Side */}
             <div className="w-full md:w-1/2 p-6 flex flex-col">
                <div className="flex-grow space-y-4">
                   <h3 className="text-xl font-bold border-b pb-2">Payment Details</h3>
                   <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                         <p className="text-gray-500">User</p>
                         <p className="font-bold">{selectedReq.userName}</p>
                      </div>
                      <div>
                         <p className="text-gray-500">Phone</p>
                         <p className="font-bold">{selectedReq.userPhone}</p>
                      </div>
                      <div>
                         <p className="text-gray-500">Amount</p>
                         <p className="font-bold text-green-600">৳ {selectedReq.amount}</p>
                      </div>
                      <div>
                         <p className="text-gray-500">TrxID</p>
                         <p className="font-bold font-mono">{selectedReq.transactionId}</p>
                      </div>
                   </div>
                   
                   <div className="bg-gray-50 p-3 rounded text-sm">
                      <p className="font-bold text-gray-700">Course:</p>
                      <p>{selectedReq.courseTitle}</p>
                   </div>

                   {selectedReq.status === 'pending' && (
                     <textarea 
                       className="w-full border p-2 rounded text-sm h-20"
                       placeholder="Admin note (optional, e.g., 'TrxID mismatch')"
                       value={adminNote}
                       onChange={e => setAdminNote(e.target.value)}
                     ></textarea>
                   )}
                </div>

                <div className="mt-6 flex space-x-3">
                   {selectedReq.status === 'pending' ? (
                     <>
                        <button onClick={() => handleAction('rejected')} className="flex-1 bg-red-100 text-red-700 py-2 rounded font-bold hover:bg-red-200">Reject</button>
                        <button onClick={() => handleAction('approved')} className="flex-1 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">Approve</button>
                     </>
                   ) : (
                     <button onClick={() => setSelectedReq(null)} className="w-full bg-gray-100 text-gray-700 py-2 rounded font-bold">Close</button>
                   )}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* METHOD EDIT MODAL */}
      {editMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={() => setEditMethod(null)}></div>
          <div className="bg-white p-6 rounded-lg shadow-xl z-10 w-full max-w-md">
             <h3 className="text-lg font-bold mb-4">Edit {editMethod.methodName}</h3>
             <div className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-gray-700">Account Number</label>
                 <input type="text" value={editMethod.accountNumber} onChange={e => setEditMethod({...editMethod, accountNumber: e.target.value})} className="w-full border p-2 rounded" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-700">Account Type</label>
                 <select value={editMethod.accountType} onChange={e => setEditMethod({...editMethod, accountType: e.target.value as any})} className="w-full border p-2 rounded">
                   <option>Personal</option>
                   <option>Merchant</option>
                   <option>Agent</option>
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-700">Instructions</label>
                 <textarea value={editMethod.instructions} onChange={e => setEditMethod({...editMethod, instructions: e.target.value})} className="w-full border p-2 rounded h-24"></textarea>
               </div>
               <button onClick={handleSaveMethod} className="w-full bg-blue-600 text-white py-2 rounded font-bold">Save Changes</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPayments;