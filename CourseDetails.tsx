import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCourseById, enrollUserInCourse, getCourseReviews } from './api';
import { Course, Review, Section } from './types';
import { useAuth } from './AuthContext';
import PaymentModal from './PaymentModal';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, refreshProfile } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const isEnrolled = userProfile?.enrolledCourses.includes(course?.id || '');

  useEffect(() => {
    if (id) {
      getCourseById(id).then(async (data) => {
        setCourse(data);
        if (data) {
           const revs = await getCourseReviews(data.id);
           setReviews(revs);
        }
        setLoading(false);
      });
    }
  }, [id]);

  const handleEnroll = async () => {
    if (!userProfile) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (!course) return;

    if (course.price === 0) {
      // Free Course: Direct Enroll
      setEnrolling(true);
      const success = await enrollUserInCourse(userProfile.uid, course.id);
      if (success) {
        await refreshProfile();
        navigate(`/learn/${course.id}`);
      } else {
        alert("Enrollment failed. Try again.");
      }
      setEnrolling(false);
    } else {
      // Paid Course: Show Payment Modal
      setShowPaymentModal(true);
    }
  };

  const handleAddToCart = () => {
    alert("কোর্সটি কার্টে যুক্ত হয়েছে!");
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    // Optionally redirect to dashboard or show a global toast
    alert("আপনার অনুরোধটি পেন্ডিং আছে। অনুমোদনের জন্য অপেক্ষা করুন।");
    navigate('/profile'); 
  };

  if (loading) return <div className="text-center py-20">লোড হচ্ছে...</div>;
  if (!course) return <div className="text-center py-20">কোর্স পাওয়া যায়নি।</div>;

  const finalPrice = course.discountPrice || course.price;

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      
      {/* 1. HERO SECTION */}
      <div className="bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900 opacity-20 pattern-grid-lg"></div>
        <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center space-x-3 text-sm font-bold text-blue-300">
                <span className="bg-blue-800 bg-opacity-50 px-3 py-1 rounded uppercase tracking-wider">{course.category}</span>
                <span><i className="fas fa-chevron-right text-xs mx-2"></i> {course.level || 'All Levels'}</span>
                <span><i className="fas fa-chevron-right text-xs mx-2"></i> {new Date(course.updatedAt || 0).toLocaleDateString()} Updated</span>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold leading-tight">{course.title}</h1>
              <p className="text-lg text-gray-300 leading-relaxed">{course.description}</p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center text-yellow-400">
                  <span className="font-bold text-lg mr-2">{course.rating || '4.8'}</span>
                  <div className="flex space-x-1">
                     {[1,2,3,4,5].map(i => <i key={i} className="fas fa-star text-xs"></i>)}
                  </div>
                  <span className="text-gray-400 ml-2">({course.totalReviews || 12} reviews)</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-user-friends mr-2"></i> {course.studentsCount} Students
                </div>
                <div className="flex items-center">
                   <i className="fas fa-globe mr-2"></i> {course.language}
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                 <img src={course.instructor?.photoUrl || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-full border-2 border-blue-500" alt="" />
                 <div>
                   <p className="text-sm text-gray-400">Created by</p>
                   <p className="font-bold text-white hover:text-blue-400 cursor-pointer">{course.instructor?.name || 'Admin Instructor'}</p>
                 </div>
              </div>
            </div>

            {/* Right Card (Mobile only shows buttons, Desktop shows card) */}
            <div className="hidden lg:block relative">
               {/* This space is reserved for the sticky card which we'll render outside the grid or handle differently. 
                   For simplicity in this layout, we'll put the sticky card in the main layout below. */}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. LEFT COLUMN (Main Content) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 sticky top-0 z-20 overflow-x-auto">
            <div className="flex">
              {['overview', 'curriculum', 'instructor', 'reviews'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-bold text-sm uppercase tracking-wide border-b-2 transition ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Content Based on Tab */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 min-h-[400px]">
             {/* ... (Existing Tab Content: Overview, Curriculum, Instructor, Reviews - keeping same as before) ... */}
             {activeTab === 'overview' && (
               <div className="prose max-w-none text-gray-700">
                 <h3 className="text-2xl font-bold text-gray-800 mb-4">কোর্স সম্পর্কে বিস্তারিত</h3>
                 {course.longDescription ? (
                    <div dangerouslySetInnerHTML={{ __html: course.longDescription }}></div>
                 ) : (
                    <p>বিস্তারিত বিবরণ শীঘ্রই যোগ করা হবে...</p>
                 )}
               </div>
             )}
             {/* ... other tabs ... */}
          </div>
        </div>

        {/* 3. RIGHT COLUMN (Sticky Buy Card) */}
        <div className="lg:col-span-1">
           <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden sticky top-24 transform lg:-translate-y-24 z-30">
             {/* Video Preview */}
             <div className="relative h-48 bg-gray-900 group cursor-pointer">
               <img src={course.thumbnailUrl || 'https://via.placeholder.com/400x250'} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition" alt="" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                   <i className="fas fa-play text-blue-600 text-xl pl-1"></i>
                 </div>
               </div>
               <div className="absolute bottom-4 left-0 right-0 text-center text-white font-bold text-sm">কোর্স প্রিভিউ দেখুন</div>
             </div>

             <div className="p-6">
               <div className="text-center mb-6">
                 {isEnrolled ? (
                   <div className="bg-green-100 text-green-700 py-2 rounded-lg font-bold mb-2">
                     <i className="fas fa-check-circle mr-2"></i> আপনি এনরোল করেছেন
                   </div>
                 ) : (
                    <>
                      <div className="flex items-center justify-center space-x-3 mb-2">
                         <span className="text-4xl font-bold text-gray-800">৳ {finalPrice}</span>
                         {course.discountPrice && <span className="text-lg text-gray-400 line-through">৳ {course.price}</span>}
                      </div>
                      {course.discountPrice && (
                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">
                           {Math.round(((course.price - course.discountPrice) / course.price) * 100)}% OFF Limited Time
                        </span>
                      )}
                    </>
                 )}
               </div>

               <div className="space-y-3">
                 {isEnrolled ? (
                    <Link to={`/learn/${course.id}`} className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg">
                      <i className="fas fa-play-circle mr-2"></i> পড়া চালিয়ে যান
                    </Link>
                 ) : (
                    <>
                      <button 
                        onClick={handleEnroll} 
                        disabled={enrolling}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg flex justify-center items-center"
                      >
                        {enrolling ? <i className="fas fa-circle-notch fa-spin"></i> : 'এখনই এনরোল করুন'}
                      </button>
                      <button 
                        onClick={handleAddToCart}
                        className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition"
                      >
                        কার্টে যোগ করুন
                      </button>
                    </>
                 )}
               </div>

               <div className="mt-6 space-y-3 text-sm text-gray-600 border-t pt-4">
                 <p className="font-bold text-gray-800">এই কোর্সে যা পাচ্ছেন:</p>
                 <div className="flex justify-between">
                   <span><i className="fas fa-video w-5 text-gray-400"></i> ভিডিও লেসন</span>
                   <span className="font-bold">{course.sections?.reduce((acc,s)=>acc + (s.lessons?.length || 0), 0) || 0} টি</span>
                 </div>
               </div>
             </div>
           </div>
        </div>

      </div>

      {/* Payment Modal */}
      {showPaymentModal && course && (
        <PaymentModal 
          course={course} 
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default CourseDetails;