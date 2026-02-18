
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, getEnrollment, updateLessonProgress, toggleLike, checkIsLiked } from './api';
import { Course, Section, Lesson, Enrollment } from './types';
import { useAuth } from './AuthContext';
import CommentSection from './CommentSection';

const CoursePlayer = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('discussion'); 
  
  // Social State
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Player State
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  useEffect(() => {
    if (!userProfile) { navigate('/login'); return; }
    if (courseId) {
      const init = async () => {
        const cData = await getCourseById(courseId);
        const eData = await getEnrollment(userProfile.uid, courseId);
        
        if (!cData || !eData) {
          alert("Access Denied or Course Not Found");
          navigate('/courses');
          return;
        }

        setCourse(cData);
        setEnrollment(eData);

        // Determine current lesson logic
        let activeLesson: Lesson | undefined;
        let activeSection: Section | undefined;

        if (lessonId) {
          for (const sec of cData.sections || []) {
            const found = sec.lessons?.find(l => l.id === lessonId);
            if (found) { activeLesson = found; activeSection = sec; break; }
          }
        } else if (eData.lastWatchedLessonId) {
           // Resume functionality
           for (const sec of cData.sections || []) {
            const found = sec.lessons?.find(l => l.id === eData.lastWatchedLessonId);
            if (found) { activeLesson = found; activeSection = sec; break; }
          }
        } 
        
        // Fallback to first lesson
        if (!activeLesson && cData.sections && cData.sections.length > 0) {
             activeSection = cData.sections[0];
             activeLesson = activeSection.lessons && activeSection.lessons.length > 0 ? activeSection.lessons[0] : undefined;
        }

        if (activeLesson) {
           setCurrentSection(activeSection || null);
           setCurrentLesson(activeLesson || null);
           setLikesCount(activeLesson.likesCount || 0);
           const liked = await checkIsLiked(userProfile.uid, activeLesson.id, 'like_lesson');
           setIsLiked(liked);
        }
        
        setLoading(false);
      };
      init();
    }
  }, [courseId, lessonId, userProfile]);

  // Handle Auto Next via YouTube Events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // YouTube Embed API sends messages
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          // Check for 'infoDelivery' or legacy 'onStateChange'
          if (data.event === 'onStateChange' || (data.event === 'infoDelivery' && data.info && data.info.playerState !== undefined)) {
             const state = data.info ? data.info.playerState : data.info;
             // State 0 is 'Ended'
             if (state === 0) {
                console.log("Video Ended - Auto Advancing");
                handleMarkComplete(true); // true = auto advance
             }
          }
        } catch (e) {
          // Ignore
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentLesson, course, enrollment]); // Dependencies critical for closure

  const handleLessonChange = (section: Section, lesson: Lesson) => {
    setCurrentSection(section);
    setCurrentLesson(lesson);
    // Reset player state
    setPlaybackSpeed(1);
    navigate(`/learn/${courseId}/lesson/${lesson.id}`);
  };

  const handleMarkComplete = async (autoAdvance = false) => {
    if (userProfile && courseId && currentLesson && course) {
       const updatedCompleted = [...(enrollment?.completedLessons || [])];
       if (!updatedCompleted.includes(currentLesson.id)) {
          updatedCompleted.push(currentLesson.id);
       }
       
       const totalLessons = course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 1;
       const progress = Math.round((updatedCompleted.length / totalLessons) * 100);

       setEnrollment(prev => prev ? ({...prev, completedLessons: updatedCompleted, progress}) : null);
       await updateLessonProgress(userProfile.uid, courseId, currentLesson.id, totalLessons);

       // Auto Advance Logic
       if (autoAdvance) {
         const allLessons = course.sections?.flatMap(s => s.lessons || []) || [];
         const currentIdx = allLessons.findIndex(l => l.id === currentLesson.id);
         if (currentIdx !== -1 && currentIdx < allLessons.length - 1) {
            const nextLesson = allLessons[currentIdx + 1];
            // Find section for next lesson
            const nextSection = course.sections?.find(s => s.lessons?.some(l => l.id === nextLesson.id));
            if (nextSection) {
                handleLessonChange(nextSection, nextLesson);
            }
         }
       }
    }
  };

  const handleToggleLike = async () => {
    if (!userProfile || !currentLesson) return;
    setIsLiked(!isLiked);
    setLikesCount(prev => !isLiked ? prev + 1 : prev - 1);
    await toggleLike(userProfile.uid, currentLesson.id, 'like_lesson', likesCount);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("লেসন লিংক কপি করা হয়েছে!");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        playerContainerRef.current?.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'setPlaybackRate',
            args: [speed]
        }), '*');
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Loading Classroom...</div>;
  if (!course || !currentLesson) return <div>Error loading content</div>;

  const isCompleted = enrollment?.completedLessons?.includes(currentLesson.id);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden font-sans">
      
      {/* 1. Header */}
      <header className="h-16 bg-gray-800 border-b border-gray-700 flex justify-between items-center px-6 flex-shrink-0 z-20 shadow-md">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/courses')} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
             <h1 className="font-bold text-lg truncate max-w-xs md:max-w-md">{course.title}</h1>
             <div className="flex items-center text-xs text-gray-400 space-x-2">
                <div className="w-24 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${enrollment?.progress || 0}%` }}></div>
                </div>
                <span>{enrollment?.progress || 0}% Completed</span>
             </div>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`text-gray-300 hover:text-white p-2 rounded transition ${sidebarOpen ? 'bg-gray-700' : ''}`}>
            <i className={`fas ${sidebarOpen ? 'fa-columns' : 'fa-list'}`}></i>
        </button>
      </header>

      <div className="flex flex-grow overflow-hidden relative">
        
        {/* 2. Main Player Area */}
        <main className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar">
           
           {/* Video Player Container */}
           <div ref={playerContainerRef} className="bg-black w-full aspect-video flex items-center justify-center relative shadow-2xl group">
             {currentLesson.type === 'video' ? (
                currentLesson.youtubeId ? (
                   <iframe 
                     ref={iframeRef}
                     src={`https://www.youtube.com/embed/${currentLesson.youtubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`} 
                     className="w-full h-full" 
                     frameBorder="0" 
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                     allowFullScreen 
                     title={currentLesson.title}
                   ></iframe>
                ) : (
                   <div className="text-center">
                     <i className="fas fa-video-slash text-6xl text-gray-700 mb-4"></i>
                     <p className="text-gray-500">Video source not found</p>
                   </div>
                )
             ) : (
                <div className="p-10 text-center bg-gray-800 rounded-lg max-w-2xl border border-gray-700">
                   <i className={`fas ${currentLesson.type === 'quiz' ? 'fa-clipboard-check' : 'fa-file-pdf'} text-6xl text-blue-500 mb-4`}></i>
                   <h2 className="text-2xl font-bold mb-2">{currentLesson.title}</h2>
                   <p className="mb-6 text-gray-400">Please complete this {currentLesson.type} activity.</p>
                   <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold transition transform hover:scale-105">Open Content</button>
                </div>
             )}
           </div>

           {/* Controls Bar */}
           <div className="bg-gray-800 px-6 py-4 flex flex-col md:flex-row justify-between items-center border-b border-gray-700 sticky top-0 z-10 gap-4 md:gap-0">
              <div className="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-start">
                 
                 {/* Like & Share */}
                 <div className="flex space-x-4">
                    <button onClick={handleToggleLike} className={`flex items-center space-x-2 text-sm font-bold transition ${isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-white'}`}>
                        <i className={`${isLiked ? 'fas' : 'far'} fa-heart`}></i> <span>{likesCount}</span>
                    </button>
                    <button onClick={handleShare} className="text-gray-400 hover:text-blue-400 transition text-sm"><i className="fas fa-share-alt mr-1"></i> Share</button>
                 </div>

                 <div className="h-6 w-px bg-gray-600 hidden md:block"></div>

                 {/* Playback Speed */}
                 <div className="relative">
                    <button 
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)} 
                      className="text-gray-300 hover:text-white text-sm font-bold flex items-center bg-gray-700 px-3 py-1.5 rounded"
                    >
                       <i className="fas fa-tachometer-alt mr-2"></i> {playbackSpeed}x
                    </button>
                    {showSpeedMenu && (
                       <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl overflow-hidden z-20 w-32">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                             <button 
                               key={speed} 
                               onClick={() => changePlaybackSpeed(speed)}
                               className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-700 ${playbackSpeed === speed ? 'text-blue-400 font-bold' : 'text-gray-300'}`}
                             >
                               {speed}x
                             </button>
                          ))}
                       </div>
                    )}
                 </div>

                 {/* Fullscreen */}
                 <button onClick={toggleFullscreen} className="text-gray-300 hover:text-white text-sm font-bold flex items-center bg-gray-700 px-3 py-1.5 rounded" title="Fullscreen">
                    <i className="fas fa-expand"></i>
                 </button>
              </div>

              <button 
                onClick={() => handleMarkComplete(true)} // Allow manual next
                className={`flex items-center px-6 py-2 rounded-full font-bold text-sm transition shadow-lg w-full md:w-auto justify-center ${isCompleted ? 'bg-green-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-200'}`}
              >
                {isCompleted ? <><i className="fas fa-check mr-2"></i> Completed</> : <><i className="far fa-circle mr-2"></i> Mark Complete</>}
              </button>
           </div>

           {/* Lesson Details & Tabs */}
           <div className="p-8 max-w-5xl mx-auto w-full">
             <h2 className="text-2xl font-bold text-white mb-2">{currentLesson.title}</h2>
             <p className="text-gray-400 text-sm mb-8 flex items-center">
                <span className="bg-blue-900 text-blue-300 px-2 py-0.5 rounded text-xs mr-3">{currentSection?.title}</span>
                {currentLesson.durationMinutes && <span><i className="far fa-clock mr-1"></i> {currentLesson.durationMinutes} min</span>}
             </p>

             <div className="flex space-x-8 border-b border-gray-700 mb-6">
                {['discussion', 'notes'].map(tab => (
                  <button 
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`pb-3 text-sm font-bold uppercase tracking-widest border-b-2 transition ${activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                  >
                    {tab}
                  </button>
                ))}
             </div>

             {activeTab === 'discussion' && (
                // Use the new powerful CommentSection instead of manual implementation
                <div className="bg-gray-100 rounded-xl">
                   <CommentSection targetId={currentLesson.id} title="Discussion" />
                </div>
             )}
             
             {activeTab === 'notes' && (
                <div className="text-gray-400 italic p-10 text-center">
                   Notes feature coming soon...
                </div>
             )}
           </div>
        </main>

        {/* 3. Playlist Sidebar */}
        <aside className={`bg-gray-800 border-l border-gray-700 w-full md:w-96 flex-shrink-0 absolute md:relative inset-y-0 right-0 transform transition-transform duration-300 z-10 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:hidden'}`}>
          <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center sticky top-0 z-10">
             <h3 className="font-bold text-gray-100">Course Content</h3>
             <span className="text-xs text-gray-500">{enrollment?.completedLessons?.length || 0} / {course.sections?.reduce((a,b)=>a + (b.lessons?.length || 0), 0) || 0} Completed</span>
          </div>
          <div className="overflow-y-auto h-full pb-20 custom-scrollbar">
            {course.sections?.map((section, sIdx) => (
               <div key={section.id} className="border-b border-gray-700">
                  <div className="px-5 py-3 bg-gray-800/50 text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between">
                     <span>Section {sIdx + 1}: {section.title}</span>
                  </div>
                  <div>
                     {section.lessons?.map((lesson, lIdx) => {
                        const active = currentLesson.id === lesson.id;
                        const completed = enrollment?.completedLessons?.includes(lesson.id);
                        return (
                           <div 
                             key={lesson.id} 
                             onClick={() => handleLessonChange(section, lesson)}
                             className={`px-5 py-4 flex items-start space-x-3 cursor-pointer transition border-l-4 ${active ? 'bg-gray-700 border-blue-500' : 'hover:bg-gray-750 border-transparent'}`}
                           >
                             <div className="mt-0.5 text-lg">
                                {completed ? <i className="fas fa-check-circle text-green-500"></i> : <i className={`far ${lesson.type === 'video' ? 'fa-play-circle' : 'fa-file'} ${active ? 'text-blue-400' : 'text-gray-600'}`}></i>}
                             </div>
                             <div>
                                <p className={`text-sm ${active ? 'text-white font-bold' : 'text-gray-300'}`}>{lesson.title}</p>
                                <p className="text-[10px] text-gray-500 mt-1">{lesson.durationMinutes ? `${lesson.durationMinutes} min` : '5 min'}</p>
                             </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            ))}
          </div>
        </aside>

      </div>
    </div>
  );
};

export default CoursePlayer;
