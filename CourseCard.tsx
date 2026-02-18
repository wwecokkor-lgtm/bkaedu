import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from './types';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const discountPercent = course.discountPrice 
    ? Math.round(((course.price - course.discountPrice) / course.price) * 100) 
    : 0;

  // Helper to convert numbers to Bangla digits (optional, can be expanded)
  const toBanglaDigit = (num: number) => num.toLocaleString('bn-BD');

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full relative font-sans">
      
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={course.thumbnailUrl || 'https://via.placeholder.com/400x225'} 
          alt={course.title} 
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
           <span className="bg-white/90 backdrop-blur-sm text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide shadow-sm">
             {course.category}
           </span>
        </div>

        {discountPercent > 0 && (
           <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm animate-pulse">
             {toBanglaDigit(discountPercent)}% ছাড়
           </div>
        )}

        {/* Quick Action Overlay (Glassmorphism) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
           <Link 
             to={`/course/${course.id}`} 
             className="bg-white text-gray-900 font-bold px-6 py-2.5 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform hover:bg-blue-50"
           >
             বিস্তারিত দেখুন
           </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        
        {/* Meta */}
        <div className="flex justify-between items-center mb-3">
           <div className="flex items-center text-yellow-500 text-xs gap-1">
              <i className="fas fa-star"></i>
              <span className="font-bold text-gray-700 text-sm">{toBanglaDigit(course.rating || 4.8)}</span>
              <span className="text-gray-400">({toBanglaDigit(course.totalReviews || 12)})</span>
           </div>
           <div className="text-xs text-gray-500 flex items-center bg-gray-100 px-2 py-1 rounded-full">
              <i className="far fa-user mr-1.5"></i> {toBanglaDigit(course.studentsCount)} জন শিক্ষার্থী
           </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
          <Link to={`/course/${course.id}`}>{course.title}</Link>
        </h3>

        {/* Author */}
        <div className="flex items-center gap-2 mb-4">
           <img 
             src={course.instructor?.photoUrl || 'https://via.placeholder.com/30'} 
             className="w-7 h-7 rounded-full border border-gray-200 object-cover" 
             alt="Instructor" 
           />
           <div>
             <p className="text-[10px] text-gray-400 leading-none">মেন্টর</p>
             <span className="text-xs text-gray-600 font-bold truncate">{course.instructor?.name || 'BK Academy'}</span>
           </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
           <div>
              {course.price === 0 ? (
                 <span className="text-green-600 font-bold text-xl">ফ্রি</span>
              ) : (
                 <div className="flex flex-col">
                    {course.discountPrice ? (
                       <>
                         <span className="text-xs text-gray-400 line-through decoration-red-400">৳{toBanglaDigit(course.price)}</span>
                         <span className="text-xl font-bold text-blue-700">৳{toBanglaDigit(course.discountPrice)}</span>
                       </>
                    ) : (
                       <span className="text-xl font-bold text-blue-700">৳{toBanglaDigit(course.price)}</span>
                    )}
                 </div>
              )}
           </div>
           
           <button className="text-blue-600 hover:bg-blue-50 p-2.5 rounded-full transition-colors border border-blue-100 hover:border-blue-200">
              <i className="far fa-bookmark"></i>
           </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;