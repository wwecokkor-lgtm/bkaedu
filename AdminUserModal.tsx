import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, UserLog, AccountStatus } from './types';
import { updateAdminUser, getUserLogs, linkParentStudent, searchUsers } from './api';
import { useAuth } from './AuthContext';

interface Props {
  user: UserProfile;
  onClose: () => void;
  onUpdate: () => void;
}

const AdminUserModal: React.FC<Props> = ({ user, onClose, onUpdate }) => {
  const { userProfile: adminProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'edit' | 'security' | 'family'>('profile');
  const [logs, setLogs] = useState<UserLog[]>([]);
  
  // Edit State
  const [editRole, setEditRole] = useState(user.role);
  const [editStatus, setEditStatus] = useState<AccountStatus>(user.status);
  const [editClass, setEditClass] = useState(user.classLevel || '');
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [loading, setLoading] = useState(false);

  // Linking State
  const [linkSearch, setLinkSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (activeTab === 'security') {
      getUserLogs(user.uid).then(setLogs);
    }
  }, [activeTab, user.uid]);

  const handleSave = async () => {
    if (!adminProfile) return;
    setLoading(true);
    await updateAdminUser(adminProfile.uid, user.uid, {
      role: editRole,
      status: editStatus,
      classLevel: editClass,
      phone: editPhone
    });
    setLoading(false);
    onUpdate();
    alert("Profile updated successfully!");
  };

  const handleLinkSearch = async () => {
    if (linkSearch.length > 2) {
      const results = await searchUsers(linkSearch);
      setSearchResults(results.filter(u => u.uid !== user.uid)); // Exclude self
    }
  };

  const handleLink = async (targetId: string) => {
    if (!adminProfile) return;
    if (user.role === UserRole.PARENT) {
      await linkParentStudent(adminProfile.uid, user.uid, targetId);
    } else if (user.role === UserRole.STUDENT) {
      await linkParentStudent(adminProfile.uid, targetId, user.uid);
    }
    alert("Linked successfully!");
    onUpdate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col md:flex-row h-[80vh]">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 border-r p-6 flex flex-col items-center">
           <img src={user.photoURL || 'https://via.placeholder.com/150'} className="w-24 h-24 rounded-full border-4 border-white shadow mb-4" />
           <h3 className="font-bold text-center text-gray-800">{user.displayName}</h3>
           <p className="text-xs text-gray-500 mb-6">{user.email}</p>
           
           <div className="w-full space-y-2">
              {['profile', 'edit', 'security', 'family'].map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab as any)}
                   className={`w-full text-left px-4 py-2 rounded-lg text-sm font-bold capitalize transition ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                 >
                   {tab}
                 </button>
              ))}
           </div>
           
           <button onClick={onClose} className="mt-auto w-full border border-red-200 text-red-600 py-2 rounded font-bold hover:bg-red-50">Close</button>
        </div>

        {/* Content */}
        <div className="flex-grow p-8 overflow-y-auto">
           
           {/* PROFILE VIEW */}
           {activeTab === 'profile' && (
              <div className="space-y-6">
                 <h2 className="text-xl font-bold border-b pb-2">User Profile</h2>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="text-xs font-bold text-gray-500 uppercase">Role</label>
                       <p className="font-bold">{user.role}</p>
                    </div>
                    <div>
                       <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                       <span className={`px-2 py-0.5 text-xs rounded font-bold uppercase ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.status}</span>
                    </div>
                    <div>
                       <label className="text-xs font-bold text-gray-500 uppercase">Points</label>
                       <p className="font-bold text-blue-600">{user.points}</p>
                    </div>
                    <div>
                       <label className="text-xs font-bold text-gray-500 uppercase">Joined</label>
                       <p>{new Date(user.joinDate).toLocaleDateString()}</p>
                    </div>
                    <div className="col-span-2">
                       <label className="text-xs font-bold text-gray-500 uppercase">Enrolled Courses</label>
                       <div className="flex flex-wrap gap-2 mt-1">
                          {user.enrolledCourses && user.enrolledCourses.length > 0 ? user.enrolledCourses.map(c => (
                             <span key={c} className="bg-gray-100 px-2 py-1 rounded text-xs">{c}</span>
                          )) : <span className="text-gray-400 italic">No courses enrolled</span>}
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {/* EDIT VIEW */}
           {activeTab === 'edit' && (
              <div className="space-y-6">
                 <h2 className="text-xl font-bold border-b pb-2">Edit Account</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-bold mb-1">Account Role</label>
                       <select value={editRole} onChange={e => setEditRole(e.target.value as any)} className="w-full border p-2 rounded">
                          {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-bold mb-1">Status</label>
                       <select value={editStatus} onChange={e => setEditStatus(e.target.value as any)} className="w-full border p-2 rounded">
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="banned">Banned</option>
                          <option value="pending">Pending</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-bold mb-1">Class Level</label>
                       <input type="text" value={editClass} onChange={e => setEditClass(e.target.value)} className="w-full border p-2 rounded" placeholder="e.g. Class 10" />
                    </div>
                    <div>
                       <label className="block text-sm font-bold mb-1">Phone</label>
                       <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full border p-2 rounded" />
                    </div>
                 </div>
                 <div className="pt-4">
                    <button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">
                       {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                 </div>
              </div>
           )}

           {/* FAMILY / LINKING */}
           {activeTab === 'family' && (
              <div className="space-y-6">
                 <h2 className="text-xl font-bold border-b pb-2">Family Linking</h2>
                 
                 <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 font-bold mb-2">Current Links:</p>
                    {user.parentId && <p className="text-sm">Parent ID: <span className="font-mono bg-white px-1 rounded">{user.parentId}</span></p>}
                    {user.childrenIds && user.childrenIds.length > 0 && (
                       <div>
                          <p className="text-xs text-gray-500">Children:</p>
                          <ul className="list-disc pl-5 text-sm">
                             {user.childrenIds.map(c => <li key={c}>{c}</li>)}
                          </ul>
                       </div>
                    )}
                    {!user.parentId && (!user.childrenIds || user.childrenIds.length === 0) && <p className="text-sm italic text-gray-500">No family members linked.</p>}
                 </div>

                 <div>
                    <h4 className="font-bold text-gray-700 mb-2">Link New Member</h4>
                    <div className="flex space-x-2">
                       <input 
                         type="text" 
                         placeholder="Search by name/email..." 
                         className="flex-grow border p-2 rounded"
                         value={linkSearch}
                         onChange={e => setLinkSearch(e.target.value)}
                       />
                       <button onClick={handleLinkSearch} className="bg-gray-800 text-white px-4 py-2 rounded">Search</button>
                    </div>
                    <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                       {searchResults.map(res => (
                          <div key={res.uid} className="flex justify-between items-center p-2 border rounded hover:bg-gray-50">
                             <div>
                                <p className="text-sm font-bold">{res.displayName}</p>
                                <p className="text-xs text-gray-500">{res.role} • {res.email}</p>
                             </div>
                             <button onClick={() => handleLink(res.uid)} className="text-blue-600 text-xs font-bold border border-blue-600 px-2 py-1 rounded hover:bg-blue-50">Link</button>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           )}

           {/* SECURITY LOGS */}
           {activeTab === 'security' && (
              <div className="space-y-4">
                 <h2 className="text-xl font-bold border-b pb-2">Audit Logs</h2>
                 <div className="space-y-2">
                    {logs && logs.length === 0 ? <p className="text-gray-500 italic">No logs found.</p> : logs?.map(log => (
                       <div key={log.id} className="text-xs border-l-2 border-gray-300 pl-3 py-1">
                          <p className="font-bold text-gray-700">{log.action}</p>
                          <p className="text-gray-500">{log.details}</p>
                          <p className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleString()} by {log.performedBy === adminProfile?.uid ? 'You' : log.performedBy}</p>
                       </div>
                    ))}
                 </div>
              </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default AdminUserModal;