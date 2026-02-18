import React, { useState, useEffect } from 'react';
import { Course, Section, Lesson } from './types';
import { generateCourseDescription, suggestCourseOutline, getYoutubeId } from './api';
import { useAuth } from './AuthContext';

interface AdminCourseEditorProps {
  initialData?: Course;
  onSave: (course: Omit<Course, 'id'>) => Promise<void>;
  onCancel: () => void;
}

// --- PROFESSIONAL IMAGE COMPRESSION UTILITY ---
// This ensures images are small enough to save in the database directly
const compressAndConvertToBase64 = (file: File, maxWidth: number, quality: number): Promise<string> => {
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

        // Maintain Aspect Ratio
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Convert to Base64 String
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
        } else {
            reject(new Error("Image processing failed"));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const AdminCourseEditor: React.FC<AdminCourseEditorProps> = ({ initialData, onSave, onCancel }) => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'basic' | 'curriculum' | 'media' | 'pricing' | 'settings'>('basic');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // --- FORM STATE ---
  const [title, setTitle] = useState(initialData?.title || '');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [longDescription, setLongDescription] = useState(initialData?.longDescription || '');
  const [category, setCategory] = useState(initialData?.category || 'Programming');
  const [level, setLevel] = useState<Course['level']>(initialData?.level || 'Beginner');
  const [language, setLanguage] = useState(initialData?.language || 'Bangla');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');
  
  const [price, setPrice] = useState<string>(initialData?.price?.toString() || '0');
  const [discountPrice, setDiscountPrice] = useState<string>(initialData?.discountPrice?.toString() || '0');
  const [pointsPrice, setPointsPrice] = useState<string>(initialData?.pointsPrice?.toString() || '0');
  
  // Media State
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnailUrl || '');
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || '');
  
  // Curriculum
  const [sections, setSections] = useState<Section[]>(initialData?.sections || []);
  
  // Instructor Data
  const [instructorName, setInstructorName] = useState(initialData?.instructor?.name || userProfile?.displayName || 'Admin Instructor');
  const [instructorBio, setInstructorBio] = useState(initialData?.instructor?.bio || userProfile?.bio || 'Professional Mentor');
  const [instructorPhoto, setInstructorPhoto] = useState(initialData?.instructor?.photoUrl || userProfile?.photoURL || '');

  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? false);

  // --- HANDLERS ---

  // 1. Image Handler (Compress & Preview)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'instructor') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validation
      if (file.size > 5 * 1024 * 1024) {
        alert("File size is too large. Max 5MB.");
        return;
      }

      try {
        setLoading(true);
        // Different settings for Thumbnail (Larger) vs Instructor (Smaller)
        const maxWidth = type === 'thumbnail' ? 800 : 300; 
        const quality = type === 'thumbnail' ? 0.8 : 0.7;
        
        const base64String = await compressAndConvertToBase64(file, maxWidth, quality);
        
        if (type === 'thumbnail') {
          setThumbnailUrl(base64String);
        } else {
          setInstructorPhoto(base64String);
        }
      } catch (err) {
        console.error("Image conversion error:", err);
        alert("Image processing failed. Please try a different image.");
      } finally {
        setLoading(false);
      }
    }
  };

  // 2. AI Handlers
  const handleAiDescription = async () => {
    if (!title) return alert("দয়া করে কোর্সের শিরোনাম লিখুন");
    setAiLoading(true);
    const desc = await generateCourseDescription(title, category);
    if (desc) setDescription(desc);
    setAiLoading(false);
  };

  const handleAiOutline = async () => {
    if (!title) return alert("দয়া করে কোর্সের শিরোনাম লিখুন");
    setAiLoading(true);
    const outline = await suggestCourseOutline(title, level || 'Beginner');
    if (outline.length > 0) setSections([...sections, ...outline]);
    setAiLoading(false);
  };

  // 3. Curriculum Handlers
  const handleAddSection = () => {
    setSections([...sections, { id: `sec-${Date.now()}`, title: 'নতুন সেকশন', lessons: [] }]);
  };

  const handleUpdateSection = (idx: number, key: keyof Section, value: any) => {
    const updated = [...sections];
    updated[idx] = { ...updated[idx], [key]: value };
    setSections(updated);
  };

  const handleDeleteSection = (idx: number) => {
    const updated = [...sections];
    updated.splice(idx, 1);
    setSections(updated);
  };

  const handleAddLesson = (sectionIdx: number) => {
    const updated = [...sections];
    if (!updated[sectionIdx].lessons) updated[sectionIdx].lessons = [];
    updated[sectionIdx].lessons.push({
      id: `les-${Date.now()}`,
      title: 'নতুন পাঠ',
      type: 'video',
      isFreePreview: false
    });
    setSections(updated);
  };

  const handleUpdateLesson = (sectionIdx: number, lessonIdx: number, key: keyof Lesson, value: any) => {
    const updated = [...sections];
    if (!updated[sectionIdx].lessons) return;
    
    if (key === 'contentUrl') {
       const ytId = getYoutubeId(value);
       if (ytId) {
          updated[sectionIdx].lessons[lessonIdx].youtubeId = ytId;
       }
    }

    updated[sectionIdx].lessons[lessonIdx] = { ...updated[sectionIdx].lessons[lessonIdx], [key]: value };
    setSections(updated);
  };

  const handleDeleteLesson = (sectionIdx: number, lessonIdx: number) => {
    const updated = [...sections];
    if (updated[sectionIdx].lessons) {
        updated[sectionIdx].lessons.splice(lessonIdx, 1);
    }
    setSections(updated);
  };

  // 4. Save Handler
  const handleSave = async () => {
    if (!title) return alert("Course title is required.");
    if (!thumbnailUrl) return alert("Course thumbnail is required.");

    setLoading(true);
    
    try {
      const courseData: Omit<Course, 'id'> = {
        title,
        subtitle,
        description,
        longDescription,
        category,
        level,
        language,
        tags: (tags || '').split(',').map(t => t.trim()),
        price: parseFloat(price) || 0,
        discountPrice: parseFloat(discountPrice) || 0,
        pointsPrice: parseFloat(pointsPrice) || 0,
        thumbnailUrl: thumbnailUrl, // Uses the Base64 string directly
        videoUrl,
        isPublished,
        sections,
        instructor: {
          name: instructorName,
          bio: instructorBio,
          photoUrl: instructorPhoto // Uses the Base64 string directly
        },
        studentsCount: initialData?.studentsCount || 0
      };

      await onSave(courseData);
      // No manual redirect needed here, parent component switches view
    } catch (error: any) {
      console.error("Save Error:", error);
      alert(`Save Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium transition-colors duration-200 whitespace-nowrap ${
        activeTab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      <i className={`fas ${icon}`}></i>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-50 px-4 md:px-6 py-4 border-b flex flex-col md:flex-row justify-between items-center gap-3">
        <h2 className="text-xl font-bold text-gray-800">
          {initialData ? 'কোর্স এডিট করুন' : 'নতুন কোর্স তৈরি করুন'}
        </h2>
        <div className="flex space-x-3 w-full md:w-auto">
          <button onClick={onCancel} className="flex-1 md:flex-none px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">
            বাতিল
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="flex-1 md:flex-none px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 flex items-center justify-center"
          >
            {loading ? (
              <>
               <i className="fas fa-spinner fa-spin mr-2"></i> সেভ হচ্ছে...
              </>
            ) : 'সংরক্ষণ করুন'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 md:px-6 border-b overflow-x-auto no-scrollbar">
        <TabButton id="basic" label="বেসিক তথ্য" icon="fa-info-circle" />
        <TabButton id="curriculum" label="পাঠ্যক্রম" icon="fa-list-ol" />
        <TabButton id="media" label="মিডিয়া" icon="fa-photo-video" />
        <TabButton id="pricing" label="মূল্য নির্ধারণ" icon="fa-tags" />
        <TabButton id="settings" label="সেটিংস" icon="fa-cog" />
      </div>

      {/* Content Area */}
      <div className="p-4 md:p-6 overflow-y-auto flex-grow custom-scrollbar">
        
        {/* --- TAB: BASIC --- */}
        {activeTab === 'basic' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">কোর্সের শিরোনাম *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" 
                  placeholder="যেমন: সম্পূর্ণ ওয়েব ডেভেলপমেন্ট গাইড"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">সাব-টাইটেল</label>
                <input 
                  type="text" 
                  value={subtitle} 
                  onChange={e => setSubtitle(e.target.value)} 
                  className="w-full border p-2 rounded" 
                  placeholder="এক নজরে কোর্সের মূল বিষয়"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ক্যাটাগরি</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border p-2 rounded">
                  <option>Programming</option>
                  <option>Design</option>
                  <option>Marketing</option>
                  <option>Business</option>
                  <option>Academic</option>
                  <option>Language</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">লেভেল</label>
                <select value={level} onChange={e => setLevel(e.target.value as any)} className="w-full border p-2 rounded">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ভাষা</label>
                <input type="text" value={language} onChange={e => setLanguage(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ট্যাগ (কমা দিয়ে আলাদা করুন)</label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full border p-2 rounded" placeholder="react, js, web" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-gray-700">সংক্ষিপ্ত বিবরণ (Short Description)</label>
                <button onClick={handleAiDescription} disabled={aiLoading} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 flex items-center">
                  <i className="fas fa-magic mr-1"></i> {aiLoading ? 'লিখছে...' : 'AI দিয়ে লিখুন'}
                </button>
              </div>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2 rounded h-24"></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">বিস্তারিত বিবরণ (HTML/Markdown)</label>
              <textarea 
                value={longDescription} 
                onChange={e => setLongDescription(e.target.value)} 
                className="w-full border p-2 rounded h-48 font-mono text-sm"
                placeholder="<h1>কোর্স সম্পর্কে বিস্তারিত...</h1>"
              ></textarea>
            </div>
          </div>
        )}

        {/* --- TAB: CURRICULUM --- */}
        {activeTab === 'curriculum' && (
          <div className="max-w-4xl mx-auto space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100 gap-3">
               <div className="text-center md:text-left">
                 <h3 className="font-bold text-blue-800">কোর্স কারিকুলাম বিল্ডার</h3>
                 <p className="text-sm text-blue-600">YouTube URL পেস্ট করলে ভিডিও ডিটেক্ট হবে।</p>
               </div>
               <div className="flex space-x-2 w-full md:w-auto">
                 <button onClick={handleAiOutline} disabled={aiLoading} className="flex-1 bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700">
                   <i className="fas fa-magic mr-1"></i> AI সাজেস্ট
                 </button>
                 <button onClick={handleAddSection} className="flex-1 bg-gray-800 text-white px-3 py-2 rounded text-sm hover:bg-gray-900">
                   <i className="fas fa-plus mr-1"></i> সেকশন যোগ
                 </button>
               </div>
             </div>

             <div className="space-y-4">
               {sections.map((section, sIdx) => (
                 <div key={section.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                   <div className="bg-gray-100 p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b">
                     <div className="flex items-center space-x-3 w-full md:w-auto">
                       <i className="fas fa-grip-lines text-gray-400 cursor-move"></i>
                       <span className="font-bold text-gray-500 whitespace-nowrap">সেকশন {sIdx + 1}:</span>
                       <input 
                         type="text" 
                         value={section.title} 
                         onChange={(e) => handleUpdateSection(sIdx, 'title', e.target.value)}
                         className="bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none px-2 py-1 font-bold text-gray-800 w-full"
                       />
                     </div>
                     <div className="flex space-x-2 self-end md:self-auto">
                       <button onClick={() => handleDeleteSection(sIdx)} className="text-red-500 hover:text-red-700 p-1"><i className="fas fa-trash"></i></button>
                       <button onClick={() => handleAddLesson(sIdx)} className="text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-600 px-2 py-1 rounded hover:bg-blue-50">+ পাঠ যোগ করুন</button>
                     </div>
                   </div>
                   
                   <div className="p-4 space-y-3 bg-gray-50/50">
                     {(!section.lessons || section.lessons.length === 0) && <p className="text-center text-gray-400 text-sm italic">কোনো পাঠ নেই।</p>}
                     {section.lessons?.map((lesson, lIdx) => (
                       <div key={lesson.id} className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4 bg-white p-3 rounded border shadow-sm">
                         <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
                           <div className="md:col-span-1">
                              <input 
                                type="text" 
                                value={lesson.title} 
                                onChange={(e) => handleUpdateLesson(sIdx, lIdx, 'title', e.target.value)}
                                className="w-full border rounded px-2 py-1 text-sm font-medium"
                                placeholder="পাঠের নাম"
                              />
                           </div>
                           <div className="md:col-span-2">
                              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                                 <select 
                                   value={lesson.type} 
                                   onChange={(e) => handleUpdateLesson(sIdx, lIdx, 'type', e.target.value)}
                                   className="border rounded px-2 py-1 text-sm bg-gray-50"
                                 >
                                   <option value="video">ভিডিও (YouTube)</option>
                                   <option value="pdf">পিডিএফ</option>
                                   <option value="quiz">কুইজ</option>
                                 </select>
                                 <input 
                                   type="text"
                                   value={lesson.contentUrl || ''}
                                   onChange={(e) => handleUpdateLesson(sIdx, lIdx, 'contentUrl', e.target.value)}
                                   className="flex-grow border rounded px-2 py-1 text-sm"
                                   placeholder="URL"
                                 />
                              </div>
                              {lesson.youtubeId && <p className="text-[10px] text-green-600 mt-1">Detected ID: {lesson.youtubeId}</p>}
                           </div>
                           <div className="flex items-center space-x-2 justify-between md:justify-start">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" checked={lesson.isFreePreview} onChange={(e) => handleUpdateLesson(sIdx, lIdx, 'isFreePreview', e.target.checked)} className="form-checkbox text-blue-600 h-4 w-4" />
                                <span className="text-xs text-gray-600">ফ্রি</span>
                              </label>
                              <button onClick={() => handleDeleteLesson(sIdx, lIdx)} className="text-gray-400 hover:text-red-500 p-1 md:ml-auto"><i className="fas fa-times"></i></button>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* --- TAB: MEDIA (THUMBNAIL) --- */}
        {activeTab === 'media' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white p-6 border rounded-lg shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">কোর্স থাম্বনেইল *</h3>
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                <div className="w-full md:w-64 h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 relative group">
                  {thumbnailUrl ? (
                    <>
                      <img src={thumbnailUrl} className="w-full h-full object-cover" alt="Thumbnail" />
                      <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                         <span className="text-white text-xs font-bold">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-400">
                       <i className="fas fa-image text-3xl mb-2"></i>
                       <p className="text-xs">No Image Selected</p>
                    </div>
                  )}
                  {/* Invisible Input covering the area */}
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={(e) => handleImageUpload(e, 'thumbnail')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex-grow w-full">
                  <p className="text-sm text-gray-600 mb-2">আপনার কোর্সের জন্য একটি আকর্ষণীয় ছবি আপলোড করুন। (800x450 pixels Recommended)</p>
                  <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded">
                     <i className="fas fa-info-circle mr-1"></i> ছবিটি অটোমেটিক কম্প্রেস করে সেভ করা হবে যাতে দ্রুত লোড হয়।
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 border rounded-lg shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">প্রোমো ভিডিও</h3>
              <label className="block text-sm font-bold text-gray-700 mb-1">YouTube Video URL</label>
              <input 
                type="text" 
                value={videoUrl} 
                onChange={e => setVideoUrl(e.target.value)} 
                className="w-full border p-2 rounded mb-2" 
                placeholder="https://youtube.com/watch?v=..." 
              />
            </div>
          </div>
        )}

        {/* --- TAB: PRICING --- */}
        {activeTab === 'pricing' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
              <p className="text-sm text-yellow-800"><i className="fas fa-lightbulb mr-2"></i> ফ্রি কোর্স তৈরি করতে মূল্য ০ রাখুন।</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">রেগুলার মূল্য (৳)</label>
                <input 
                  type="number" 
                  value={price} 
                  onChange={e => setPrice(e.target.value)} 
                  className="w-full border p-2 rounded text-lg font-bold text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ডিসকাউন্ট মূল্য (৳)</label>
                <input 
                  type="number" 
                  value={discountPrice} 
                  onChange={e => setDiscountPrice(e.target.value)} 
                  className="w-full border p-2 rounded text-lg font-bold text-green-600"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-bold text-gray-800 mb-4">রিওয়ার্ড পয়েন্ট</h4>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">পয়েন্ট দিয়ে কিনুন</label>
                <input 
                  type="number" 
                  value={pointsPrice} 
                  onChange={e => setPointsPrice(e.target.value)} 
                  className="w-full border p-2 rounded"
                  placeholder="যেমন: 5000 পয়েন্ট"
                />
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: SETTINGS & INSTRUCTOR --- */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white p-6 border rounded-lg shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">কোর্স স্ট্যাটাস</h3>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                 <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 p-2 rounded hover:bg-gray-100">
                   <input type="radio" name="status" checked={isPublished} onChange={() => setIsPublished(true)} className="form-radio text-green-600" />
                   <span className="text-gray-800 font-medium">প্রকাশিত (Published)</span>
                 </label>
                 <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 p-2 rounded hover:bg-gray-100">
                   <input type="radio" name="status" checked={!isPublished} onChange={() => setIsPublished(false)} className="form-radio text-gray-600" />
                   <span className="text-gray-800 font-medium">ড্রাফট (Draft)</span>
                 </label>
              </div>
            </div>

            {/* INSTRUCTOR INFORMATION EDITOR */}
            <div className="bg-white p-6 border rounded-lg shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">ইনস্ট্রাক্টর তথ্য</h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                   <div className="flex-shrink-0 relative group">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100">
                         {instructorPhoto ? (
                            <img src={instructorPhoto} alt="Instructor" className="w-full h-full object-cover" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400"><i className="fas fa-user text-2xl"></i></div>
                         )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 shadow z-10">
                         <i className="fas fa-camera text-xs"></i>
                         <input 
                           type="file" 
                           className="hidden" 
                           accept="image/*" 
                           onChange={(e) => handleImageUpload(e, 'instructor')} 
                         />
                      </label>
                   </div>
                   <div className="flex-grow">
                      <p className="text-sm text-gray-600 mb-1 font-bold">প্রোফাইল ছবি</p>
                      <p className="text-xs text-gray-400">ছবি আপলোড করলে অটোমেটিক সেভ হবে।</p>
                   </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">নাম</label>
                  <input type="text" value={instructorName} onChange={e => setInstructorName(e.target.value)} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">বায়ো</label>
                  <textarea value={instructorBio} onChange={e => setInstructorBio(e.target.value)} className="w-full border p-2 rounded h-20"></textarea>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourseEditor;