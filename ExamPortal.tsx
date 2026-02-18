import React, { useEffect, useState, useRef } from 'react';
import { getExams, submitExamResult } from './api';
import { Exam, Question } from './types';
import { useAuth } from './AuthContext';
import { useOffline } from './OfflineContext';
import { useNavigate } from 'react-router-dom';

// ... (QuestionPalette and Timer Helper Components remain same)
const QuestionPalette = ({ 
  total, 
  current, 
  answers, 
  markedForReview, 
  onNavigate 
}: { 
  total: number, 
  current: number, 
  answers: {[key: string]: any}, 
  markedForReview: string[], 
  onNavigate: (idx: number) => void 
}) => {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: total }).map((_, idx) => {
        const isAnswered = answers[idx] !== undefined;
        const isMarked = markedForReview.includes(idx.toString());
        const isActive = current === idx;
        
        let bgClass = "bg-white border-gray-300 text-gray-700";
        if (isActive) bgClass = "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300";
        else if (isMarked) bgClass = "bg-purple-500 text-white border-purple-500";
        else if (isAnswered) bgClass = "bg-green-500 text-white border-green-500";

        return (
          <button
            key={idx}
            onClick={() => onNavigate(idx)}
            className={`w-10 h-10 rounded-lg border font-bold text-sm flex items-center justify-center transition-all ${bgClass}`}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );
};

const Timer = ({ durationMinutes, onTimeUp }: { durationMinutes: number, onTimeUp: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft < 300; 

  return (
    <div className={`flex items-center space-x-2 font-mono text-xl font-bold px-4 py-2 rounded-lg ${isWarning ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-800'}`}>
      <i className="far fa-clock"></i>
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};

const ExamPortal = () => {
  const { userProfile } = useAuth();
  const { saveDraft, getDraft, clearDraft, isOnline } = useOffline();
  const navigate = useNavigate();
  
  const [view, setView] = useState<'LIST' | 'INSTRUCTIONS' | 'ACTIVE' | 'RESULT'>('LIST');
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: any}>({}); 
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [violations, setViolations] = useState(0);
  const [examResult, setExamResult] = useState<{score: number, total: number, correct: number, wrong: number, status: string} | null>(null);

  useEffect(() => {
    getExams().then(data => setExams(data.filter(e => e.isActive)));
  }, []);

  // --- AUTO RECOVERY & SAVE ---
  useEffect(() => {
    if (activeExam) {
      // 1. Recover Draft
      const draft = getDraft(`exam_${activeExam.id}_${userProfile?.uid}`);
      if (draft && view === 'ACTIVE' && Object.keys(answers).length === 0) {
        setAnswers(draft.answers || {});
        setMarkedForReview(draft.marked || []);
        setCurrentQIndex(draft.index || 0);
        console.log("Draft Recovered");
      }
    }
  }, [activeExam, view]);

  useEffect(() => {
    // 2. Auto Save Draft
    if (view === 'ACTIVE' && activeExam) {
      saveDraft(`exam_${activeExam.id}_${userProfile?.uid}`, {
        answers,
        marked: markedForReview,
        index: currentQIndex
      });
    }
  }, [answers, markedForReview, currentQIndex]);

  // ... (Anti-Cheating Hook and Renderers remain same, just updated Submit Logic)

  useEffect(() => {
    if (view === 'ACTIVE') {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setViolations(prev => prev + 1);
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [view]);

  const selectExam = (exam: Exam) => {
    if (!userProfile) return navigate('/login');
    setActiveExam(exam);
    setView('INSTRUCTIONS');
  };

  const startExam = () => {
    setView('ACTIVE');
    if (!getDraft(`exam_${activeExam?.id}_${userProfile?.uid}`)) {
        setAnswers({});
        setMarkedForReview([]);
        setViolations(0);
        setCurrentQIndex(0);
    }
  };

  const handleAnswer = (optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [currentQIndex]: optionIdx }));
  };

  const toggleReview = () => {
    const idxStr = currentQIndex.toString();
    setMarkedForReview(prev => 
      prev.includes(idxStr) ? prev.filter(i => i !== idxStr) : [...prev, idxStr]
    );
  };

  const submitExam = async () => {
    if (!activeExam || !userProfile) return;

    let score = 0;
    let correct = 0;
    let wrong = 0;

    activeExam.questions.forEach((q, idx) => {
      const userAnswer = answers[idx];
      if (userAnswer !== undefined && q.correctOptions.includes(userAnswer)) {
        score += q.marks;
        correct++;
      } else if (userAnswer !== undefined) {
        score -= (q.negativeMarks || 0);
        wrong++;
      }
    });

    const passed = score >= activeExam.passingMarks;
    
    // Save Result to Firestore (Offline Persistence Enabled)
    await submitExamResult({
      examId: activeExam.id,
      userId: userProfile.uid,
      userName: userProfile.displayName,
      score,
      totalMarks: activeExam.totalMarks,
      answers,
      status: 'completed',
      submittedAt: Date.now(),
      date: Date.now(),
      violations
    });

    // Clear Draft
    clearDraft(`exam_${activeExam.id}_${userProfile.uid}`);

    setExamResult({
      score,
      total: activeExam.totalMarks,
      correct,
      wrong,
      status: passed ? 'Passed' : 'Failed'
    });

    setView('RESULT');
    if (document.fullscreenElement) document.exitFullscreen();
  };

  // ... (View Renderers match previous, just using new state)
  
  if (view === 'LIST') {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="text-center mb-10">
           <h1 className="text-4xl font-bold text-gray-800 mb-3">লাইভ এক্সাম পোর্টাল</h1>
           <p className="text-gray-500">আপনার দক্ষতা যাচাই করুন এবং সার্টিফিকেট অর্জন করুন</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => (
            <div key={exam.id} className="bg-white rounded-xl shadow-lg border-t-4 border-blue-600 hover:shadow-xl transition-all p-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <i className="fas fa-file-signature text-8xl text-blue-600"></i>
               </div>
               <div className="relative z-10">
                 <h3 className="text-xl font-bold text-gray-800 mb-2">{exam.title}</h3>
                 <div className="text-sm text-gray-600 space-y-2 mb-6">
                    <p><i className="far fa-clock text-blue-500 w-6"></i> সময়: {exam.durationMinutes} মিনিট</p>
                    <p><i className="far fa-question-circle text-blue-500 w-6"></i> প্রশ্ন: {exam.questions.length} টি</p>
                    <p><i className="fas fa-trophy text-blue-500 w-6"></i> মোট মার্কস: {exam.totalMarks}</p>
                 </div>
                 <button onClick={() => selectExam(exam)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
                    অংশগ্রহণ করুন
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ... (Instructions View)
  if (view === 'INSTRUCTIONS' && activeExam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
           <div className="bg-blue-600 p-6 text-white text-center">
              <h2 className="text-2xl font-bold">{activeExam.title}</h2>
              <p className="opacity-90">নির্দেশাবলী মনোযোগ সহকারে পড়ুন</p>
           </div>
           <div className="p-8 space-y-4 text-gray-700">
              <ul className="list-disc pl-5 space-y-2">
                 <li>পরীক্ষার মোট সময় <strong>{activeExam.durationMinutes} মিনিট</strong>।</li>
                 <li>মোট প্রশ্ন <strong>{activeExam.questions.length}টি</strong> এবং মোট নম্বর <strong>{activeExam.totalMarks}</strong>।</li>
                 <li className="text-red-600 font-bold">পরীক্ষা চলাকালীন ট্যাব পরিবর্তন করলে বা উইন্ডো মিনিমাইজ করলে পরীক্ষা বাতিল হতে পারে।</li>
              </ul>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-6">
                 <p className="text-sm text-yellow-800">আপনি কি প্রস্তুত? "পরীক্ষা শুরু করুন" বাটনে ক্লিক করার সাথে সাথে সময় গণনা শুরু হবে।</p>
              </div>
           </div>
           <div className="p-6 bg-gray-50 flex justify-between">
              <button onClick={() => setView('LIST')} className="text-gray-600 font-bold hover:text-gray-800">ফিরে যান</button>
              <button onClick={startExam} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg transform hover:-translate-y-1 transition">
                 পরীক্ষা শুরু করুন
              </button>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'ACTIVE' && activeExam) {
    const question = activeExam.questions[currentQIndex];
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
         <header className="bg-white shadow-sm px-6 py-3 flex justify-between items-center sticky top-0 z-20">
            <div>
               <h1 className="font-bold text-gray-800 text-lg hidden md:block">{activeExam.title}</h1>
               <span className="text-xs text-gray-500">Question {currentQIndex + 1} of {activeExam.questions.length}</span>
               {!isOnline && <span className="ml-2 text-xs text-red-500 font-bold">(Offline Mode - Answers Saved Locally)</span>}
            </div>
            <Timer durationMinutes={activeExam.durationMinutes} onTimeUp={submitExam} />
            <button 
              onClick={() => { if(confirm("আপনি কি নিশ্চিত আপনি এখনই জমা দিতে চান?")) submitExam(); }} 
              className="bg-red-500 text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-600"
            >
              Finish Exam
            </button>
         </header>

         <div className="flex-grow flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
            <main className="flex-grow bg-white rounded-xl shadow-sm p-6 md:p-10 overflow-y-auto">
               <div className="mb-6 pb-4 border-b">
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded mb-2 inline-block">Marks: {question.marks}</span>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 mt-2 leading-relaxed">{question.questionText}</h2>
               </div>
               <div className="space-y-3 max-w-2xl">
                  {question.options.map((option, idx) => (
                     <label key={idx} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 ${answers[currentQIndex] === idx ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200'}`}>
                        <input type="radio" name={`q-${currentQIndex}`} className="h-5 w-5 text-blue-600 focus:ring-blue-500" checked={answers[currentQIndex] === idx} onChange={() => handleAnswer(idx)} />
                        <span className="ml-3 font-medium text-gray-700">{option}</span>
                     </label>
                  ))}
               </div>
            </main>
            <aside className="w-full md:w-80 bg-white rounded-xl shadow-sm p-4 flex flex-col">
               <QuestionPalette total={activeExam.questions.length} current={currentQIndex} answers={answers} markedForReview={markedForReview} onNavigate={setCurrentQIndex} />
               <div className="mt-auto space-y-2 border-t pt-4">
                  <button onClick={toggleReview} className={`w-full py-2 rounded font-bold text-sm border ${markedForReview.includes(currentQIndex.toString()) ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                     {markedForReview.includes(currentQIndex.toString()) ? 'Unmark Review' : 'Mark for Review'}
                  </button>
                  <div className="flex space-x-2 pt-2">
                     <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(prev => prev - 1)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-bold disabled:opacity-50">Previous</button>
                     <button disabled={currentQIndex === activeExam.questions.length - 1} onClick={() => setCurrentQIndex(prev => prev + 1)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">Next</button>
                  </div>
               </div>
            </aside>
         </div>
      </div>
    );
  }

  // ... (Result View)
  if (view === 'RESULT' && examResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden text-center relative">
            <div className={`h-32 ${examResult.status === 'Passed' ? 'bg-green-600' : 'bg-red-600'} flex items-center justify-center relative`}>
               <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg absolute -bottom-12">
                  <i className={`fas ${examResult.status === 'Passed' ? 'fa-trophy text-green-600' : 'fa-times-circle text-red-600'} text-4xl`}></i>
               </div>
            </div>
            <div className="pt-16 pb-10 px-8">
               <h2 className="text-3xl font-bold text-gray-800 mb-2">{examResult.status === 'Passed' ? 'অভিনন্দন! আপনি পাস করেছেন।' : 'দুঃখিত! আপনি পাস করতে পারেননি।'}</h2>
               <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="p-4 bg-blue-50 rounded-xl"><p className="text-sm text-gray-500 uppercase font-bold">Score</p><p className="text-2xl font-bold text-blue-600">{examResult.score}</p></div>
                  <div className="p-4 bg-green-50 rounded-xl"><p className="text-sm text-gray-500 uppercase font-bold">Correct</p><p className="text-2xl font-bold text-green-600">{examResult.correct}</p></div>
                  <div className="p-4 bg-red-50 rounded-xl"><p className="text-sm text-gray-500 uppercase font-bold">Wrong</p><p className="text-2xl font-bold text-red-600">{examResult.wrong}</p></div>
               </div>
               <button onClick={() => setView('LIST')} className="px-8 py-3 bg-gray-800 text-white rounded-full font-bold">অন্য পরীক্ষা দিন</button>
            </div>
         </div>
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default ExamPortal;