import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { UserRole } from './types';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, userProfile } = useAuth();

  // Redirect logic after login
  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect handled by useEffect or AuthContext state change logic if needed, 
      // but usually we wait for auth state change.
      // We will rely on the fact that AuthContext updates and we can redirect.
      // However, for immediate feedback:
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error("Login Error:", err);
      // 'auth/invalid-credential' is the new unified error for wrong email/password
      if (
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/invalid-login-credentials'
      ) {
         setError('ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।');
      } else if (err.code === 'auth/too-many-requests') {
         setError('অতিরিক্ত চেষ্টার কারণে অ্যাকাউন্ট সাময়িক লক করা হয়েছে। পরে চেষ্টা করুন।');
      } else {
         setError('লগইন ব্যর্থ হয়েছে। সংযোগ পরীক্ষা করুন।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('গুগল লগইন বাতিল করা হয়েছে।');
      } else {
        setError('গুগল লগইন ব্যর্থ হয়েছে।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex overflow-hidden">
        
        {/* Left Side - Image/Branding */}
        <div className="hidden md:flex w-1/2 bg-blue-600 text-white flex-col justify-center p-12 relative">
          <div className="absolute inset-0 bg-blue-700 opacity-20 pattern-grid-lg"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-4">BK Academy</h1>
            <p className="text-blue-100 text-lg mb-8">আপনার শেখার যাত্রা শুরু হোক এখান থেকেই। আমাদের সাথে যোগ দিন এবং নিজেকে দক্ষ করে তুলুন।</p>
            <div className="flex items-center space-x-2 text-sm text-blue-200">
              <i className="fas fa-check-circle"></i> <span>২০+ প্রফেশনাল কোর্স</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-200 mt-2">
              <i className="fas fa-check-circle"></i> <span>লাইভ এক্সাম ও সার্টিফিকেট</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-200 mt-2">
              <i className="fas fa-check-circle"></i> <span>২৪/৭ সাপোর্ট</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-800 to-transparent opacity-50"></div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="text-center mb-8">
             <h2 className="text-3xl font-bold text-gray-800">স্বাগতম!</h2>
             <p className="text-gray-500 mt-2">আপনার অ্যাকাউন্টে লগইন করুন</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded text-sm flex items-start">
               <i className="fas fa-exclamation-circle mt-0.5 mr-2"></i>
               <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">ইমেইল এড্রেস</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-envelope text-gray-400"></i>
                </div>
                <input 
                  type="email" 
                  className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 text-sm font-bold">পাসওয়ার্ড</label>
                <a href="#" className="text-xs text-blue-600 hover:underline">পাসওয়ার্ড ভুলে গেছেন?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-400"></i>
                </div>
                <input 
                  type="password" 
                  className="w-full border border-gray-300 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition duration-300 shadow-lg transform hover:-translate-y-0.5 flex justify-center items-center"
            >
              {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : 'লগইন'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">অথবা</span>
              </div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="mt-6 w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
              গুগল দিয়ে লগইন করুন
            </button>
          </div>

          <p className="mt-8 text-center text-gray-600 text-sm">
            অ্যাকাউন্ট নেই? <Link to="/register" className="text-blue-600 font-bold hover:underline">নিবন্ধন করুন</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;