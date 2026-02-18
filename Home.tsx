
import React, { useEffect, useState, useRef } from 'react';
import { getCourses, getNews } from './api';
import { Course, NewsPost } from './types';
import { Link } from 'react-router-dom';
import { useSite } from './SiteContext';
import CourseCard from './CourseCard';

// --- CUSTOM HOOK FOR ANIMATED NUMBERS ---
const useCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.5 }
    );
    if (countRef.current) observer.observe(countRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration, isVisible]);

  // Helper to convert to Bangla digits
  const toBangla = (num: number) => num.toLocaleString('bn-BD');

  return { count: toBangla(count), countRef };
};

const Home = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { config } = useSite();

  useEffect(() => {
    const fetchData = async () => {
      const [fetchedCourses, fetchedNews] = await Promise.all([getCourses(), getNews()]);
      setCourses(fetchedCourses);
      setNews(fetchedNews.slice(0, 3));
      setLoading(false);
    };
    fetchData();
  }, []);

  // --- SECTIONS COMPONENTS ---

  const HeroSection = () => (
    <section className="relative -mt-[88px] pt-32 pb-16 lg:pt-48 lg:pb-24 overflow-hidden bg-slate-900 text-white font-sans">
      {/* Abstract Backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f172a] to-blue-900"></div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-600 rounded-full mix-blend-screen filter blur-[100px] opacity-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Text Content */}
          <div className="text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/50 border border-blue-700/50 text-blue-200 text-sm font-bold animate-fade-in">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              বাংলাদেশের সেরা অনলাইন লার্নিং প্ল্যাটফর্ম
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
              প্রথম শ্রেণি থেকে দ্বাদশ<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">সম্পূর্ণ ডিজিটাল শিক্ষা</span>
            </h1>
            
            <p className="text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              অভিজ্ঞ শিক্ষকদের ক্লাস, লাইভ এক্সাম, লেকচার শিট এবং সার্বক্ষণিক গাইডেন্স - সবকিছু এখন এক প্ল্যাটফর্মে। আপনার সন্তানের উজ্জ্বল ভবিষ্যতের জন্য আমরা আছি পাশে।
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link to="/courses" className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-500 transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                কোর্স দেখুন <i className="fas fa-arrow-right"></i>
              </Link>
              <Link to="/register" className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition flex items-center justify-center gap-2">
                <i className="far fa-play-circle"></i> ফ্রি ক্লাস করুন
              </Link>
            </div>

            {/* Stats Pills */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start pt-6 text-sm font-medium text-slate-400">
               <div className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> ১০,০০০+ শিক্ষার্থী</div>
               <div className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> ৫০০+ ভিডিও ক্লাস</div>
               <div className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> লাইভ এক্সাম</div>
            </div>
          </div>

          {/* Hero Image / Illustration */}
          <div className="relative hidden lg:block">
             <div className="relative z-10 transform hover:scale-105 transition duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80" 
                  alt="Student Studying" 
                  className="rounded-3xl shadow-2xl border-4 border-slate-700/50 w-full object-cover h-[500px]" 
                />
                
                {/* Floating Cards */}
                <div className="absolute top-10 -left-12 bg-white p-4 rounded-xl shadow-xl animate-bounce-slow text-slate-800">
                   <div className="flex items-center gap-3">
                      <div className="bg-orange-100 p-3 rounded-full text-orange-600"><i className="fas fa-book-open"></i></div>
                      <div>
                         <p className="text-xs text-gray-500 font-bold">লাইভ ক্লাস</p>
                         <p className="text-sm font-bold">প্রতিদিন সন্ধ্যা ৭টায়</p>
                      </div>
                   </div>
                </div>

                <div className="absolute bottom-10 -right-8 bg-white p-4 rounded-xl shadow-xl animate-bounce-slow delay-700 text-slate-800">
                   <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-3 rounded-full text-green-600"><i className="fas fa-poll"></i></div>
                      <div>
                         <p className="text-xs text-gray-500 font-bold">মডেল টেস্ট</p>
                         <p className="text-sm font-bold">রেজাল্ট ও র‍্যাঙ্কিং</p>
                      </div>
                   </div>
                </div>
             </div>
             {/* Decorative Elements */}
             <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-slate-700/30 rounded-full animate-spin-slow"></div>
          </div>
        </div>
      </div>
    </section>
  );

  const ClassNavigation = () => (
    <section className="py-16 bg-white relative -mt-10 z-20">
       <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
             <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">কোন ক্লাসে পড়ছেন?</h2>
                <p className="text-gray-500 mt-2">আপনার শ্রেণি নির্বাচন করুন এবং পড়াশোনা শুরু করুন</p>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {['১ম - ৫ম শ্রেণি', '৬ষ্ঠ শ্রেণি', '৭ম শ্রেণি', '৮ম শ্রেণি', '৯ম - ১০ম শ্রেণি', '১১শ - ১২শ শ্রেণি'].map((cls, idx) => (
                   <Link 
                     to={`/courses?class=${idx+1}`} 
                     key={idx} 
                     className="group flex flex-col items-center justify-center p-6 rounded-xl bg-gray-50 border border-gray-100 hover:bg-blue-600 hover:border-blue-600 hover:shadow-lg transition duration-300"
                   >
                      <div className="w-12 h-12 mb-3 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-sm group-hover:text-blue-600 text-xl font-bold">
                         {idx + 1}
                      </div>
                      <span className="font-bold text-gray-700 group-hover:text-white text-center text-sm">{cls}</span>
                   </Link>
                ))}
             </div>
          </div>
       </div>
    </section>
  );

  const SubjectSection = () => (
    <section className="py-20 bg-gray-50">
       <div className="container mx-auto px-4">
          <div className="text-center mb-12">
             <h2 className="text-3xl font-bold text-gray-900">জনপ্রিয় বিষয়সমূহ</h2>
             <p className="text-gray-500 mt-2">যেকোনো কঠিন বিষয় এখন হবে সহজ</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
             {[
               { name: 'গণিত', icon: 'fa-calculator', color: 'blue' },
               { name: 'বিজ্ঞান', icon: 'fa-flask', color: 'purple' },
               { name: 'ইংরেজি', icon: 'fa-language', color: 'red' },
               { name: 'আইসিটি', icon: 'fa-laptop-code', color: 'green' },
               { name: 'বাংলা', icon: 'fa-book', color: 'indigo' },
               { name: 'ধর্ম শিক্ষা', icon: 'fa-mosque', color: 'yellow' },
             ].map((sub, idx) => (
                <Link to={`/courses?subject=${sub.name}`} key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition flex flex-col items-center gap-3">
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl bg-${sub.color}-50 text-${sub.color}-600`}>
                      <i className={`fas ${sub.icon}`}></i>
                   </div>
                   <span className="font-bold text-gray-700">{sub.name}</span>
                </Link>
             ))}
          </div>
       </div>
    </section>
  );

  const FeaturedCourses = () => (
    <section className="py-20 bg-white">
       <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10">
             <div>
                <span className="text-blue-600 font-bold text-sm uppercase tracking-wider bg-blue-50 px-2 py-1 rounded">সেরা কোর্সসমূহ</span>
                <h2 className="text-3xl font-bold text-gray-900 mt-2">জনপ্রিয় কোর্সগুলো দেখে নিন</h2>
             </div>
             <Link to="/courses" className="text-gray-600 hover:text-blue-600 font-bold flex items-center gap-2 group mt-4 md:mt-0">
                সব কোর্স দেখুন <i className="fas fa-arrow-right transform group-hover:translate-x-1 transition"></i>
             </Link>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
               {[1,2,3,4].map(i => <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse"></div>)}
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {courses.slice(0, 4).map(course => (
                   <CourseCard key={course.id} course={course} />
                ))}
             </div>
          )}
       </div>
    </section>
  );

  const ParentTrustSection = () => (
    <section className="py-20 bg-blue-50 overflow-hidden relative">
       {/* Background Pattern */}
       <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>
       
       <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             <div className="order-2 lg:order-1">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                   অভিভাবকদের আস্থা ও বিশ্বাস <br/>
                   <span className="text-blue-600">BK Academy</span>-তে কেন?
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                   আমরা শুধু পড়াই না, আমরা যত্ন নেই। আপনার সন্তানের পড়াশোনার অগ্রগতি এবং নিরাপত্তার সম্পূর্ণ দায়িত্ব আমাদের।
                </p>
                
                <div className="space-y-6">
                   {[
                     { title: 'নিরাপদ অনলাইন পরিবেশ', desc: 'অপ্রয়োজনীয় কন্টেন্ট মুক্ত সম্পূর্ণ শিক্ষামূলক প্ল্যাটফর্ম।', icon: 'fa-shield-alt', color: 'green' },
                     { title: 'প্রোগ্রেস ট্র্যাকিং', desc: 'অভিভাবকরা ড্যাশবোর্ড থেকে সন্তানের পরীক্ষার রেজাল্ট দেখতে পারবেন।', icon: 'fa-chart-line', color: 'blue' },
                     { title: 'এক্সপার্ট মেন্টর', desc: 'দেশের সেরা বিশ্ববিদ্যালয় পড়ুয়া ভাইয়া-আপুরা ক্লাস নেন।', icon: 'fa-chalkboard-teacher', color: 'purple' },
                   ].map((item, idx) => (
                      <div key={idx} className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                         <div className={`w-12 h-12 rounded-full bg-${item.color}-100 flex items-center justify-center text-xl text-${item.color}-600 flex-shrink-0`}>
                            <i className={`fas ${item.icon}`}></i>
                         </div>
                         <div>
                            <h4 className="text-lg font-bold text-gray-800 mb-1">{item.title}</h4>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
             
             <div className="order-1 lg:order-2 relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                   <img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80" alt="Happy Students" className="w-full h-auto" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                   <div className="absolute bottom-6 left-6 text-white">
                      <p className="text-2xl font-bold">৯৮%</p>
                      <p className="text-sm opacity-90">অভিভাবক সন্তুষ্টি</p>
                   </div>
                </div>
                {/* Decoration */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse"></div>
             </div>
          </div>
       </div>
    </section>
  );

  const ExamSection = () => (
    <section className="py-20 bg-slate-900 text-white relative">
       <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
             <i className="fas fa-stopwatch text-5xl text-yellow-400 mb-6 animate-bounce"></i>
             <h2 className="text-3xl md:text-4xl font-bold mb-4">সামনে পরীক্ষা? প্রস্তুতি নাও সেরা ভাবে!</h2>
             <p className="text-slate-300 mb-10 text-lg">
                আমাদের প্ল্যাটফর্মে রয়েছে ১০০০+ মডেল টেস্ট এবং লাইভ এক্সাম ফিচার। 
                নিজের মেধা যাচাই করো এবং লিডারবোর্ডে নিজের অবস্থান দেখো।
             </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/exams" className="bg-green-600 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-green-500 transition shadow-lg shadow-green-500/30">
                   এখনই পরীক্ষা দিন
                </Link>
                <Link to="/courses" className="bg-transparent border border-white text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-white/10 transition">
                   রুটিন দেখুন
                </Link>
             </div>
          </div>
       </div>
    </section>
  );

  const StatsSection = () => {
    const s1 = useCounter(15000);
    const s2 = useCounter(500);
    const s3 = useCounter(1200);
    const s4 = useCounter(50);

    return (
      <section className="py-16 bg-white border-t border-gray-100">
         <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
               <div>
                  <h3 className="text-3xl md:text-4xl font-bold text-blue-600 mb-1"><span ref={s1.countRef}>{s1.count}</span>+</h3>
                  <p className="text-gray-500 font-medium">শিক্ষার্থী</p>
               </div>
               <div>
                  <h3 className="text-3xl md:text-4xl font-bold text-purple-600 mb-1"><span ref={s2.countRef}>{s2.count}</span>+</h3>
                  <p className="text-gray-500 font-medium">ক্লাস ভিডিও</p>
               </div>
               <div>
                  <h3 className="text-3xl md:text-4xl font-bold text-green-600 mb-1"><span ref={s3.countRef}>{s3.count}</span>+</h3>
                  <p className="text-gray-500 font-medium">নোটস ও শিট</p>
               </div>
               <div>
                  <h3 className="text-3xl md:text-4xl font-bold text-orange-600 mb-1"><span ref={s4.countRef}>{s4.count}</span>+</h3>
                  <p className="text-gray-500 font-medium">মেন্টর</p>
               </div>
            </div>
         </div>
      </section>
    );
  };

  const Testimonials = () => (
    <section className="py-20 bg-gray-50 overflow-hidden">
       <div className="container mx-auto px-4 text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">শিক্ষার্থীরা যা বলছে</h2>
          <p className="text-gray-500 mt-2">আমাদের সফল শিক্ষার্থীদের মতামত</p>
       </div>
       
       <div className="relative w-full overflow-hidden">
          <div className="flex gap-6 animate-scroll-left hover:pause px-4">
             {/* Duplicate array for infinite scroll effect */}
             {[1,2,3,4,1,2,3,4].map((i, idx) => (
                <div key={idx} className="min-w-[300px] md:min-w-[350px] bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex-shrink-0">
                   <div className="flex text-yellow-400 text-xs mb-4 gap-1">
                      <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                   </div>
                   <p className="text-gray-600 text-sm mb-6 leading-relaxed italic">"BK Academy-এর ক্লাসগুলো খুব সহজ ও সাবলীল। বিশেষ করে গণিতের ক্লাসগুলো আমার খুব ভালো লেগেছে। এখন আমি অনেক কনফিডেন্ট।"</p>
                   <div className="flex items-center gap-3">
                      <img src={`https://randomuser.me/api/portraits/men/${i*10}.jpg`} className="w-10 h-10 rounded-full" alt="User" />
                      <div className="text-left">
                         <p className="font-bold text-sm text-gray-900">আরিফ হাসান</p>
                         <p className="text-xs text-gray-500">১০ম শ্রেণি, বিজ্ঞান</p>
                      </div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </section>
  );

  const NewsSection = () => (
      <section className="py-20 bg-gray-50">
         <div className="container mx-auto px-4">
            <div className="text-center mb-12">
               <h2 className="text-3xl font-bold text-gray-900">ব্লগ ও নোটিশ</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {news.map(item => (
                  <Link to="/news" key={item.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition">
                     <div className="h-48 bg-gray-200 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <span className="absolute bottom-4 left-4 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">নোটিশ</span>
                     </div>
                     <div className="p-6">
                        <p className="text-xs text-gray-500 mb-2">{new Date(item.timestamp).toLocaleDateString('bn-BD')}</p>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition line-clamp-2">{item.title}</h3>
                        <p className="text-gray-500 text-sm mt-2 line-clamp-3">{item.content}</p>
                        <span className="text-blue-600 text-xs font-bold mt-4 block uppercase tracking-wide">পড়ুন</span>
                     </div>
                  </Link>
               ))}
            </div>
         </div>
      </section>
  );

  const CallToAction = () => (
    <section className="py-20 bg-white">
       <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <h2 className="text-3xl md:text-5xl font-bold">শেখা শুরু করতে প্রস্তুত?</h2>
                <p className="text-blue-100 text-lg">আজই জয়েন করুন এবং আপনার পড়াশোনাকে নিয়ে যান অন্য উচ্চতায়।</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                   <Link to="/register" className="bg-white text-blue-700 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-gray-100 transition transform hover:-translate-y-1">রেজিস্ট্রেশন করুন</Link>
                   <Link to="/courses" className="bg-transparent border border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition">কোর্স দেখুন</Link>
                </div>
             </div>
          </div>
       </div>
    </section>
  );

  // Map of component IDs to Render Functions
  const sectionMap: Record<string, React.JSX.Element> = {
    hero: <HeroSection key="hero" />,
    classNav: <ClassNavigation key="classNav" />,
    subjects: <SubjectSection key="subjects" />,
    featuredCourses: <FeaturedCourses key="featuredCourses" />,
    trust: <ParentTrustSection key="trust" />,
    exams: <ExamSection key="exams" />,
    stats: <StatsSection key="stats" />,
    testimonials: <Testimonials key="testimonials" />,
    news: <NewsSection key="news" />,
    cta: <CallToAction key="cta" />
  };

  return (
    <div className="font-sans antialiased bg-white">
      {/* Dynamic Section Rendering */}
      {config?.homeSections ? (
        config.homeSections.map(section => 
          section.enabled && sectionMap[section.id] ? sectionMap[section.id] : null
        )
      ) : (
        // Fallback if config not loaded
        <>
          <HeroSection />
          <ClassNavigation />
          <SubjectSection />
          <FeaturedCourses />
          <ParentTrustSection />
          <ExamSection />
          <StatsSection />
          <Testimonials />
          <NewsSection />
          <CallToAction />
        </>
      )}
    </div>
  );
};

export default Home;
