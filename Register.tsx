import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole, UserProfile } from './types';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    dob: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Validation
    if (formData.password !== formData.confirmPassword) {
      setError('পাসওয়ার্ড দুটি মিলছে না।');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।');
      setLoading(false);
      return;
    }
    if (!formData.agreeTerms) {
      setError('দয়া করে শর্তাবলীতে সম্মতি দিন।');
      setLoading(false);
      return;
    }

    try {
      // 2. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 3. Update Profile (DisplayName)
      await updateProfile(user, { displayName: formData.name });

      // 4. Create Firestore Profile
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: formData.name,
        role: UserRole.USER,
        points: 50, // Welcome Bonus
        enrolledCourses: [],
        phone: formData.phone,
        gender: formData.gender,
        dob: formData.dob,
        joinDate: Date.now(),
        isBlocked: false,
        status: 'active',
        isVerified: false
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      // 5. Success
      alert("নিবন্ধন সফল হয়েছে!");
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হচ্ছে।');
      } else {
        setError(err.message || 'নিবন্ধন ব্যর্থ হয়েছে।');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 py-10 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl border-t-4 border-green-600">
        <div className="text-center mb-8">
           <h2 className="text-3xl font-bold text-gray-800">অ্যাকাউন্ট তৈরি করুন</h2>
           <p className="text-gray-500">BK Academy পরিবারের সদস্য হোন</p>
        </div>

        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded text-sm">
               {error}
            </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Name */}
             <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">পুরো নাম *</label>
                <input 
                  type="text" 
                  name="name"
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
             </div>
             {/* Email */}
             <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">ইমেইল *</label>
                <input 
                  type="email" 
                  name="email"
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
             </div>
             {/* Phone */}
             <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">মোবাইল নাম্বার</label>
                <input 
                  type="tel" 
                  name="phone"
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.phone}
                  onChange={handleChange}
                />
             </div>
             {/* Gender */}
             <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">লিঙ্গ</label>
                <select 
                  name="gender" 
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Male">পুরুষ</option>
                  <option value="Female">মহিলা</option>
                  <option value="Other">অন্যান্য</option>
                </select>
             </div>
             {/* Password */}
             <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">পাসওয়ার্ড * (মিন. ৬ অক্ষর)</label>
                <input 
                  type="password" 
                  name="password"
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
             </div>
             {/* Confirm Password */}
             <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">পাসওয়ার্ড নিশ্চিত করুন *</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
             </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-center">
            <input 
              type="checkbox" 
              name="agreeTerms"
              id="terms"
              className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              checked={formData.agreeTerms}
              onChange={handleChange}
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              আমি <a href="#" className="text-green-600 hover:underline">শর্তাবলী</a> এবং <a href="#" className="text-green-600 hover:underline">গোপনীয়তা নীতি</a> মেনে নিচ্ছি।
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition duration-300 shadow-md flex justify-center"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : 'নিবন্ধন সম্পন্ন করুন'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 text-sm">
          ইতিমধ্যে অ্যাকাউন্ট আছে? <Link to="/login" className="text-green-600 font-bold hover:underline">লগইন করুন</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;