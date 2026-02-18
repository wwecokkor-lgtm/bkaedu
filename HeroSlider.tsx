import React, { useEffect, useState } from 'react';
import { Slide } from './types';
import { getSlides } from './api';
import { Link } from 'react-router-dom';

const HeroSlider = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    getSlides().then(data => setSlides(data.filter(s => s.isActive)));
  }, []);

  useEffect(() => {
    if (slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [slides]);

  if (slides.length === 0) {
    // Fallback Default Hero if no slides
    return (
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between mb-12">
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">আপনার উজ্জ্বল ভবিষ্যতের সূচনা হোক এখানেই</h1>
          <p className="text-lg text-blue-100">BK Academy-তে যুক্ত হয়ে নিজের দক্ষতা বাড়ান এবং ক্যারিয়ারে এক ধাপ এগিয়ে যান।</p>
          <div className="flex space-x-4">
            <Link to="/courses" className="bg-white text-blue-700 px-6 py-3 rounded-full font-bold shadow hover:bg-gray-100 transition">কোর্স দেখুন</Link>
            <Link to="/register" className="bg-blue-500 bg-opacity-30 border border-white px-6 py-3 rounded-full font-bold text-white hover:bg-blue-600 transition">জয়েন করুন</Link>
          </div>
        </div>
        <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center">
           <i className="fas fa-graduation-cap text-9xl text-blue-300 opacity-50"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-12 h-[400px] md:h-[500px]">
      {slides.map((slide, index) => (
        <div 
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          {/* Background */}
          <div className="absolute inset-0">
             {slide.imageUrl ? (
               <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-800"></div>
             )}
             <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          </div>

          {/* Content */}
          <div className="relative z-20 h-full flex flex-col justify-center items-center text-center text-white px-4 md:px-20">
             <h2 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-md animate-fade-in-up">{slide.title}</h2>
             <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl drop-shadow-sm">{slide.subtitle}</p>
             {slide.ctaText && (
               <Link 
                 to={slide.ctaLink || '#'} 
                 className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition transform hover:-translate-y-1 shadow-lg"
               >
                 {slide.ctaText}
               </Link>
             )}
          </div>
        </div>
      ))}
      
      {/* Dots */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center space-x-2">
        {slides.map((_, idx) => (
          <button 
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-3 h-3 rounded-full transition-all ${currentSlide === idx ? 'bg-white w-8' : 'bg-white bg-opacity-50'}`}
          ></button>
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;