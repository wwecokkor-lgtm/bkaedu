import React, { useEffect, useState } from 'react';
import { getCourses } from './api';
import { Course } from './types';
import { Link } from 'react-router-dom';

const CourseList = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [priceFilter, setPriceFilter] = useState('All'); // All, Free, Paid
  const [sortBy, setSortBy] = useState('newest'); // newest, price-low, price-high

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const fetch = async () => {
      const data = await getCourses();
      setCourses(data);
      setFilteredCourses(data);
      setLoading(false);
    };
    fetch();
  }, []);

  useEffect(() => {
    let result = [...courses];

    // Search
    if (searchTerm) {
      result = result.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Category
    if (selectedCategory !== 'All') {
      result = result.filter(c => c.category === selectedCategory);
    }

    // Level
    if (selectedLevel !== 'All') {
      result = result.filter(c => c.level === selectedLevel);
    }

    // Price
    if (priceFilter === 'Free') {
      result = result.filter(c => c.price === 0);
    } else if (priceFilter === 'Paid') {
      result = result.filter(c => c.price > 0);
    }

    // Sort
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else {
      // Newest
      result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    setFilteredCourses(result);
    setCurrentPage(1); // Reset page on filter change
  }, [courses, searchTerm, selectedCategory, selectedLevel, priceFilter, sortBy]);

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(courses.map(c => c.category)))];

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        
        {/* Header & Search */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">আমাদের সব কোর্স</h1>
          <p className="text-gray-500 max-w-2xl mx-auto mb-8">আপনার দক্ষতা বৃদ্ধির জন্য সঠিক কোর্সটি বেছে নিন। আমরা অফার করছি বিশ্বমানের কারিকুলাম এবং অভিজ্ঞ মেন্টর।</p>
          
          <div className="max-w-xl mx-auto relative">
            <input 
              type="text" 
              placeholder="কোর্সের নাম দিয়ে খুঁজুন..." 
              className="w-full py-3 px-5 pr-12 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search absolute right-5 top-3.5 text-gray-400"></i>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-1/4 space-y-8">
            {/* Category Filter */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">ক্যাটাগরি</h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <label key={cat} className="flex items-center space-x-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="category" 
                      className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                    />
                    <span className={`text-sm ${selectedCategory === cat ? 'text-blue-600 font-bold' : 'text-gray-600 group-hover:text-blue-600'}`}>
                      {cat}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Level Filter */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">লেভেল</h3>
              <div className="space-y-2">
                {['All', 'Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                   <label key={lvl} className="flex items-center space-x-3 cursor-pointer group">
                     <input 
                       type="radio" 
                       name="level" 
                       className="form-radio text-blue-600 focus:ring-blue-500"
                       checked={selectedLevel === lvl}
                       onChange={() => setSelectedLevel(lvl)}
                     />
                     <span className={`text-sm ${selectedLevel === lvl ? 'text-blue-600 font-bold' : 'text-gray-600 group-hover:text-blue-600'}`}>{lvl}</span>
                   </label>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">মূল্য</h3>
              <div className="flex space-x-2">
                {['All', 'Free', 'Paid'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPriceFilter(p)}
                    className={`flex-1 py-2 text-sm rounded border ${priceFilter === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Course Grid */}
          <div className="w-full lg:w-3/4">
            {/* Sorting Header */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-500 text-sm">দেখানো হচ্ছে <span className="font-bold text-gray-800">{filteredCourses.length}</span> টি কোর্স</p>
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">নতুন যোগ করা</option>
                <option value="price-low">দাম (কম থেকে বেশি)</option>
                <option value="price-high">দাম (বেশি থেকে কম)</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <i className="far fa-sad-tear text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">কোনো কোর্স খুঁজে পাওয়া যায়নি।</p>
                <button onClick={() => {setSearchTerm(''); setSelectedCategory('All');}} className="mt-4 text-blue-600 font-bold hover:underline">ফিল্টার রিসেট করুন</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentItems.map(course => (
                  <div key={course.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group flex flex-col h-full">
                    {/* Thumbnail */}
                    <div className="relative overflow-hidden">
                      <img 
                        src={course.thumbnailUrl || 'https://via.placeholder.com/400x250'} 
                        alt={course.title} 
                        className="w-full h-48 object-cover transform group-hover:scale-110 transition duration-500" 
                      />
                      {course.discountPrice && course.discountPrice < course.price && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          {Math.round(((course.price - course.discountPrice) / course.price) * 100)}% OFF
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center">
                        <i className="fas fa-video mr-1"></i> {course.sections?.reduce((acc, s) => acc + s.lessons.length, 0) || 0} Lessons
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-grow flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">{course.category}</span>
                         <div className="flex items-center text-yellow-400 text-xs">
                           <i className="fas fa-star"></i>
                           <span className="text-gray-600 font-bold ml-1">{course.rating || '4.8'}</span>
                           <span className="text-gray-400 ml-1">({course.totalReviews || 0})</span>
                         </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition">{course.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{course.description}</p>
                      
                      <div className="mt-auto border-t pt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                           <img src={course.instructor?.photoUrl || 'https://via.placeholder.com/40'} className="w-8 h-8 rounded-full border" alt="Inst" />
                           <span className="text-xs text-gray-600 font-medium truncate max-w-[80px]">{course.instructor?.name || 'Admin'}</span>
                        </div>
                        <div className="text-right">
                          {course.price === 0 ? (
                            <span className="text-lg font-bold text-green-600">ফ্রি</span>
                          ) : (
                            <div className="flex flex-col items-end">
                              {course.discountPrice ? (
                                <>
                                  <span className="text-xs text-gray-400 line-through">৳ {course.price}</span>
                                  <span className="text-lg font-bold text-gray-800">৳ {course.discountPrice}</span>
                                </>
                              ) : (
                                <span className="text-lg font-bold text-gray-800">৳ {course.price}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover Action */}
                    <Link 
                      to={`/course/${course.id}`}
                      className="block bg-gray-100 text-gray-800 text-center py-3 font-bold text-sm hover:bg-blue-600 hover:text-white transition"
                    >
                      বিস্তারিত দেখুন <i className="fas fa-arrow-right ml-1"></i>
                    </Link>
                  </div>
                ))}
              </div>
            )}
            
            {/* Functional Pagination */}
            {!loading && totalPages > 1 && (
               <div className="mt-10 flex justify-center space-x-2">
                 <button 
                   onClick={() => paginate(currentPage - 1)} 
                   disabled={currentPage === 1}
                   className="px-4 py-2 border rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Previous
                 </button>
                 
                 {[...Array(totalPages)].map((_, idx) => (
                   <button 
                     key={idx} 
                     onClick={() => paginate(idx + 1)}
                     className={`px-4 py-2 rounded font-bold transition ${currentPage === idx + 1 ? 'bg-blue-600 text-white shadow-lg' : 'border text-gray-600 hover:bg-gray-100'}`}
                   >
                     {idx + 1}
                   </button>
                 ))}

                 <button 
                   onClick={() => paginate(currentPage + 1)} 
                   disabled={currentPage === totalPages}
                   className="px-4 py-2 border rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Next
                 </button>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseList;
