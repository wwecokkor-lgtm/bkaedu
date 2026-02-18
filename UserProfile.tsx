
import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToUserExamHistory, subscribeToUserActivities, subscribeToUserCertificates, getEnrolledCourses } from './api'; // UPDATED: Imports
import { doc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth'; 
import { db, auth } from './firebase'; 
import { ExamResult, ActivityLog, Certificate, Course } from './types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- IMAGE COMPRESSION UTILITY ---
const compressAndConvertToBase64 = (file: File, maxWidth: number = 300): Promise<string> => {
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
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(dataUrl);
        } else {
            reject(new Error("Canvas context failed"));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const UserProfilePage = () => {
  const { userProfile, refreshProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'exams' | 'certificates' | 'settings'>('overview');
  
  // Data State
  const [examHistory, setExamHistory] = useState<ExamResult[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [enrolledCoursesData, setEnrolledCoursesData] = useState<Course[]>([]);
  
  // Edit State
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.displayName || '');
      setEditBio(userProfile.bio || '');
      setEditPhone(userProfile.phone || '');
      setEditAddress(userProfile.address || '');

      // REAL-TIME SUBSCRIPTIONS
      const unsubExams = subscribeToUserExamHistory(userProfile.uid, setExamHistory);
      const unsubActs = subscribeToUserActivities(userProfile.uid, setActivities);
      const unsubCerts = subscribeToUserCertificates(userProfile.uid, setCertificates);
      
      // Courses are still fetched once, as enrollment is less frequent real-time need
      getEnrolledCourses(userProfile.enrolledCourses).then(setEnrolledCoursesData);

      return () => {
        unsubExams();
        unsubActs();
        unsubCerts();
      };
    }
  }, [userProfile]);

  if (!userProfile) return <div className="p-10 text-center">লোড হচ্ছে...</div>;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingPhoto(true);
      try {
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
            alert("ফাইল সাইজ ৫ মেগাবাইটের বেশি হতে পারবে না।");
            setUploadingPhoto(false);
            return;
        }
        const base64Image = await compressAndConvertToBase64(file, 400);
        await updateDoc(doc(db, 'users', userProfile.uid), { photoURL: base64Image });
        await refreshProfile();
      } catch (error) {
        console.error("Profile upload failed:", error);
        alert("ছবি আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        displayName: editName,
        bio: editBio,
        phone: editPhone,
        address: editAddress
      });
      await refreshProfile();
      alert("প্রোফাইল আপডেট সফল হয়েছে!");
    } catch (error) {
      console.error(error);
      alert("আপডেট ব্যর্থ হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (confirm(`Send password reset email to ${userProfile.email}?`)) {
        try {
            await sendPasswordResetEmail(auth, userProfile.email);
            alert("পাসওয়ার্ড রিসেট ইমেল পাঠানো হয়েছে! আপনার ইনবক্স চেক করুন।");
        } catch (error: any) {
            console.error(error);
            alert("Error: " + error.message);
        }
    }
  };

  // Mock Chart Data
  const progressData = [
    { name: 'Jan', study: 10, exam: 65 },
    { name: 'Feb', study: 25, exam: 70 },
    { name: 'Mar', study: 40, exam: 75 },
    { name: 'Apr', study: 55, exam: 82 },
    { name: 'May', study: 70, exam: 88 },
    { name: 'Jun', study: 85, exam: 95 },
  ];

  const StatCard = ({ icon, title, value, color }: any) => (
    <div className={`bg-white p-6 rounded-xl shadow border-l-4 ${color} flex items-center space-x-4 transition hover:-translate-y-1`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl ${color.replace('border-', 'bg-')}`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div>
        <p className="text-gray-500 text-xs font-bold uppercase">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* 1. Header Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Cover Photo */}
        <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
          <div className="absolute top-4 right-4 text-white text-xs bg-black bg-opacity-30 px-3 py-1 rounded-full backdrop-blur-sm">
            Student ID: {userProfile.uid.slice(0, 8).toUpperCase()}
          </div>
        </div>
        
        <div className="px-8 pb-8 flex flex-col md:flex-row items-end -mt-16 md:space-x-8">
           {/* Profile Image */}
           <div className="relative group">
             <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-md bg-white overflow-hidden relative">
                <img 
                  src={userProfile.photoURL || 'https://via.placeholder.com/150'} 
                  alt="Profile" 
                  className={`w-full h-full object-cover transition duration-300 ${uploadingPhoto ? 'opacity-50 blur-sm' : ''}`}
                />
                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin text-blue-600 text-2xl"></i>
                  </div>
                )}
             </div>
             
             <label className="absolute bottom-2 right-2 bg-gray-800 text-white p-2 rounded-full cursor-pointer hover:bg-gray-900 shadow-lg transition transform group-hover:scale-110 z-10">
               <i className="fas fa-camera text-sm"></i>
               <input 
                 type="file" 
                 className="hidden" 
                 accept="image/png, image/jpeg, image/jpg"
                 onChange={handlePhotoUpload} 
                 disabled={uploadingPhoto}
               />
             </label>
           </div>
           
           {/* Info */}
           <div className="mt-4 md:mt-0 flex-grow text-center md:text-left">
             <h1 className="text-3xl font-bold text-gray-900">{userProfile.displayName}</h1>
             <p className="text-gray-500 font-medium">{userProfile.bio || 'শিখছি এবং নিজেকে গড়ছি...'}</p>
             <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
               <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold flex items-center">
                 <i className="fas fa-user-tag mr-2"></i> {userProfile.role.toUpperCase()}
               </span>
               <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-bold flex items-center">
                 <i className="fas fa-coins mr-2"></i> {userProfile.points} Points
               </span>
               <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-bold flex items-center">
                 <i className="fas fa-check-circle mr-2"></i> Verified
               </span>
             </div>
           </div>

           {/* Actions */}
           <div className="mt-4 md:mt-0 flex space-x-3">
             <button onClick={() => setActiveTab('settings')} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition text-sm">
               <i className="fas fa-cog mr-2"></i> সেটিংস
             </button>
             <button onClick={logout} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition text-sm">
               <i className="fas fa-sign-out-alt mr-2"></i> লগআউট
             </button>
           </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-8 border-t flex overflow-x-auto space-x-8 no-scrollbar">
          {['overview', 'courses', 'exams', 'certificates', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 text-sm font-bold border-b-2 transition whitespace-nowrap capitalize ${
                activeTab === tab 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'overview' && <i className="fas fa-chart-pie mr-2"></i>}
              {tab === 'courses' && <i className="fas fa-book mr-2"></i>}
              {tab === 'exams' && <i className="fas fa-edit mr-2"></i>}
              {tab === 'certificates' && <i className="fas fa-certificate mr-2"></i>}
              {tab === 'settings' && <i className="fas fa-user-cog mr-2"></i>}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Tab Content */}
      <div className="min-h-[400px]">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon="fa-book-open" title="এনরোল্ড কোর্স" value={userProfile.enrolledCourses.length} color="border-blue-500" />
              <StatCard icon="fa-trophy" title="সম্পন্ন পরীক্ষা" value={examHistory.length} color="border-green-500" />
              <StatCard icon="fa-certificate" title="সার্টিফিকেট" value={certificates.length} color="border-purple-500" />
              <StatCard icon="fa-star" title="অর্জিত পয়েন্ট" value={userProfile.points} color="border-yellow-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow">
                <h3 className="text-lg font-bold text-gray-800 mb-6">লার্নিং প্রোগ্রেস ও পারফরমেন্স</h3>
                <div className="h-72 w-full" style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={300}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="study" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Study Hours" />
                      <Line type="monotone" dataKey="exam" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} name="Exam Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-xl shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">সাম্প্রতিক কার্যক্রম</h3>
                  <button className="text-xs text-blue-600 hover:underline">সব দেখুন</button>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {activities.map((act) => (
                    <div key={act.id} className="flex space-x-3 pb-3 border-b last:border-0 border-gray-100">
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white ${
                        act.type === 'learning' ? 'bg-blue-500' : 
                        act.type === 'exam' ? 'bg-green-500' : 'bg-gray-400'
                      }`}>
                        <i className={`fas ${act.type === 'learning' ? 'fa-book' : act.type === 'exam' ? 'fa-pen' : 'fa-info'}`}></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{act.action}</p>
                        <p className="text-xs text-gray-500">{act.details}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(act.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && <p className="text-sm text-gray-500 text-center py-4">কোনো কার্যক্রম পাওয়া যায়নি।</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">আমার কোর্সসমূহ ({enrolledCoursesData.length})</h2>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-full">চলমান</button>
                <button className="px-3 py-1 text-sm bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300">সম্পন্ন</button>
              </div>
            </div>

            {enrolledCoursesData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCoursesData.map(course => (
                  <div key={course.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                    <div className="relative">
                       <img src={course.thumbnailUrl || 'https://via.placeholder.com/300x150'} alt={course.title} className="w-full h-40 object-cover" />
                       <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-bold text-gray-800">
                         {course.category}
                       </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-800 mb-2 truncate" title={course.title}>{course.title}</h3>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>প্রোগ্রেস</span>
                          <span className="font-bold text-blue-600">45%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                      </div>

                      <button className="w-full bg-blue-50 text-blue-700 py-2 rounded font-bold text-sm hover:bg-blue-100 transition">
                        পড়া চালিয়ে যান
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <i className="fas fa-book-open text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">আপনি এখনও কোনো কোর্সে এনরোল করেননি।</p>
                <button className="mt-4 text-blue-600 font-bold hover:underline" onClick={() => window.location.hash = '#/courses'}>কোর্স ব্রাউজ করুন</button>
              </div>
            )}
          </div>
        )}

        {/* EXAMS TAB (REALTIME) */}
        {activeTab === 'exams' && (
           <div className="bg-white rounded-xl shadow overflow-hidden">
             <div className="p-6 border-b">
               <h2 className="text-xl font-bold text-gray-800">পরীক্ষার ফলাফল ও ইতিহাস (লাইভ আপডেট)</h2>
             </div>
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">পরীক্ষার নাম</th>
                     <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">তারিখ</th>
                     <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">স্কোর</th>
                     <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">স্ট্যাটাস</th>
                     <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">অ্যাকশন</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {examHistory.map((exam) => (
                     <tr key={exam.id} className="hover:bg-gray-50">
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                         Exam ID: {exam.examId.slice(0, 8)}...
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         {new Date(exam.date).toLocaleDateString()}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                         {exam.score} / {exam.totalMarks}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                           (exam.score / exam.totalMarks) >= 0.5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                         }`}>
                           {(exam.score / exam.totalMarks) >= 0.5 ? 'Pass' : 'Fail'}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                         <button className="text-blue-600 hover:text-blue-900"><i className="fas fa-download"></i></button>
                       </td>
                     </tr>
                   ))}
                   {examHistory.length === 0 && (
                     <tr>
                       <td colSpan={5} className="px-6 py-10 text-center text-gray-500">কোনো পরীক্ষার ইতিহাস নেই।</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {/* CERTIFICATES TAB */}
        {activeTab === 'certificates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map(cert => (
              <div key={cert.id} className="bg-white p-6 rounded-xl shadow border border-gray-100 flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-2xl mb-4">
                   <i className="fas fa-certificate"></i>
                 </div>
                 <h3 className="font-bold text-lg text-gray-800">{cert.courseTitle}</h3>
                 <p className="text-sm text-gray-500 mb-4">ইস্যু তারিখ: {new Date(cert.issueDate).toLocaleDateString()}</p>
                 <div className="flex space-x-3">
                   <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 shadow">
                     <i className="fas fa-download mr-2"></i> ডাউনলোড
                   </button>
                   <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded text-sm font-bold hover:bg-gray-200">
                     <i className="fas fa-share-alt mr-2"></i> শেয়ার
                   </button>
                 </div>
              </div>
            ))}
            {certificates.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm">
                <i className="fas fa-award text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">আপনি এখনও কোনো সার্টিফিকেট অর্জন করেননি। কোর্স সম্পন্ন করুন।</p>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">প্রোফাইল এডিট করুন</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">পুরো নাম</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">ফোন নাম্বার</label>
                  <input 
                    type="text" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">বায়ো (Bio)</label>
                <textarea 
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none h-24"
                  placeholder="আপনার সম্পর্কে কিছু লিখুন..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ঠিকানা</label>
                <input 
                  type="text" 
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 shadow-lg flex items-center"
                >
                  {saving && <i className="fas fa-spinner fa-spin mr-2"></i>}
                  পরিবর্তন সেভ করুন
                </button>
              </div>
            </form>
            
            <div className="mt-10 pt-6 border-t">
              <h3 className="text-red-600 font-bold mb-4">ডেঞ্জার জোন</h3>
              <div className="flex justify-between items-center bg-red-50 p-4 rounded border border-red-100">
                <div>
                  <p className="text-sm font-bold text-gray-800">পাসওয়ার্ড পরিবর্তন</p>
                  <p className="text-xs text-gray-500">আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করুন।</p>
                </div>
                <button 
                  onClick={handlePasswordReset} 
                  className="text-red-600 border border-red-200 bg-white px-3 py-1 rounded text-sm hover:bg-red-100"
                >
                  রিসেট করুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
