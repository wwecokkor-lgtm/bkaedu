import React, { useState, useEffect } from 'react';
import { Exam, Question } from './types';
import { createExam, getExams } from './api';

const AdminExams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Exam Config State
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [totalMarks, setTotalMarks] = useState(0);
  const [passingMarks, setPassingMarks] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Question Editor State
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('MCQ');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [marks, setMarks] = useState(1);
  const [negative, setNegative] = useState(0);

  useEffect(() => {
    refreshExams();
  }, []);

  const refreshExams = () => getExams().then(setExams);

  const addQuestion = () => {
    if (!qText) return alert("প্রশ্ন লিখুন");
    if (qType === 'MCQ' && options.some(o => !o)) return alert("সব অপশন পূরণ করুন");

    const newQ: Question = {
      id: Date.now().toString(),
      type: qType as any,
      questionText: qText,
      options: qType === 'MCQ' ? [...options] : [],
      correctOptions: [correctIdx],
      marks: Number(marks),
      negativeMarks: Number(negative),
    };

    setQuestions([...questions, newQ]);
    setTotalMarks(prev => prev + newQ.marks);
    
    // Reset Form
    setQText('');
    setOptions(['', '', '', '']);
    setCorrectIdx(0);
  };

  const updateOption = (idx: number, val: string) => {
    const newOpts = [...options];
    newOpts[idx] = val;
    setOptions(newOpts);
  };

  const handleSaveExam = async () => {
    if (!title || questions.length === 0) return alert("শিরোনাম এবং প্রশ্ন আবশ্যক");
    
    setLoading(true);
    await createExam({
      title,
      durationMinutes: Number(duration),
      totalMarks,
      passingMarks: Number(passingMarks),
      questions,
      isActive: true,
      shuffleQuestions: true,
      allowReview: true
    });
    setLoading(false);
    setShowCreator(false);
    
    // Reset
    setTitle(''); setQuestions([]); setTotalMarks(0);
    refreshExams();
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h2 className="text-xl md:text-2xl font-bold text-gray-800">পরীক্ষা নিয়ন্ত্রণ</h2>
           <p className="text-gray-500 text-sm">Professional Exam Manager</p>
        </div>
        <button onClick={() => setShowCreator(!showCreator)} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow flex items-center w-full md:w-auto justify-center">
          <i className={`fas ${showCreator ? 'fa-times' : 'fa-plus'} mr-2`}></i>
          {showCreator ? 'বাতিল' : 'নতুন পরীক্ষা তৈরি করুন'}
        </button>
      </div>

      {showCreator ? (
        <div className="space-y-6 animate-fade-in">
          {/* Exam Settings */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
            <h3 className="font-bold text-lg text-gray-800 border-b pb-2 mb-4">পরীক্ষার সেটিংস</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">পরীক্ষার শিরোনাম</label>
                  <input type="text" className="w-full border p-2 rounded" value={title} onChange={e => setTitle(e.target.value)} placeholder="যেমন: সাধারণ জ্ঞান কুইজ - ১" />
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">সময় (মিনিট)</label>
                  <input type="number" className="w-full border p-2 rounded" value={duration} onChange={e => setDuration(Number(e.target.value))} />
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">পাস মার্কস</label>
                  <input type="number" className="w-full border p-2 rounded" value={passingMarks} onChange={e => setPassingMarks(Number(e.target.value))} />
               </div>
            </div>
          </div>

          {/* Question Editor */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-lg text-gray-800 border-b pb-2 mb-4">প্রশ্ন তৈরি করুন</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
               <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">প্রশ্ন</label>
                  <input type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={qText} onChange={e => setQText(e.target.value)} placeholder="প্রশ্ন লিখুন..." />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">টাইপ</label>
                  <select className="w-full border p-2 rounded" value={qType} onChange={e => setQType(e.target.value)}>
                     <option value="MCQ">MCQ (Single Choice)</option>
                     <option value="TrueFalse">True / False</option>
                  </select>
               </div>
            </div>

            {/* MCQ Options */}
            {qType === 'MCQ' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {options.map((opt, idx) => (
                     <div key={idx} className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="correct" 
                          checked={correctIdx === idx} 
                          onChange={() => setCorrectIdx(idx)} 
                          className="h-4 w-4 text-green-600"
                        />
                        <input 
                          type="text" 
                          className="w-full border p-2 rounded text-sm" 
                          placeholder={`অপশন ${idx + 1}`} 
                          value={opt} 
                          onChange={e => updateOption(idx, e.target.value)} 
                        />
                     </div>
                  ))}
               </div>
            )}

            <div className="flex gap-4 mb-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Marks</label>
                  <input type="number" className="w-20 border p-2 rounded" value={marks} onChange={e => setMarks(Number(e.target.value))} />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Negative</label>
                  <input type="number" className="w-20 border p-2 rounded text-red-600" value={negative} onChange={e => setNegative(Number(e.target.value))} />
               </div>
            </div>

            <button onClick={addQuestion} className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold hover:bg-gray-900 w-full md:w-auto">
               + প্রশ্ন যোগ করুন
            </button>
          </div>

          {/* Question List Preview */}
          {questions.length > 0 && (
             <div className="bg-gray-50 p-6 rounded-xl border">
                <h4 className="font-bold mb-4 flex flex-col sm:flex-row justify-between">
                   <span>প্রশ্ন তালিকা ({questions.length})</span>
                   <span className="text-blue-600 mt-2 sm:mt-0">মোট মার্কস: {totalMarks}</span>
                </h4>
                <div className="space-y-2">
                   {questions.map((q, idx) => (
                      <div key={idx} className="bg-white p-3 rounded shadow-sm border border-gray-200 flex justify-between items-center">
                         <div className="flex-grow pr-4">
                            <span className="font-bold mr-2 text-gray-500">{idx + 1}.</span>
                            <span>{q.questionText}</span>
                            <span className="text-xs text-gray-400 ml-2 block sm:inline">({q.type})</span>
                         </div>
                         <button onClick={() => {
                            const n = [...questions];
                            n.splice(idx, 1);
                            setQuestions(n);
                            setTotalMarks(prev => prev - q.marks);
                         }} className="text-red-500 hover:bg-red-50 p-1 rounded"><i className="fas fa-trash"></i></button>
                      </div>
                   ))}
                </div>
             </div>
          )}

          <div className="flex justify-end">
             <button 
               onClick={handleSaveExam} 
               disabled={loading}
               className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg w-full md:w-auto"
             >
               {loading ? 'সেভ হচ্ছে...' : 'পরীক্ষা পাবলিশ করুন'}
             </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => (
             <div key={exam.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
               <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-full ${exam.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                     <i className="fas fa-clipboard-list text-xl"></i>
                  </div>
                  <div className="text-right">
                     <span className={`px-2 py-1 text-xs font-bold rounded-full ${exam.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                       {exam.isActive ? 'Active' : 'Draft'}
                     </span>
                  </div>
               </div>
               
               <h3 className="font-bold text-lg text-gray-800 mb-1">{exam.title}</h3>
               <div className="text-sm text-gray-500 space-y-1 mb-4">
                  <p>সময়: {exam.durationMinutes} মিনিট</p>
                  <p>মার্কস: {exam.totalMarks} (Pass: {exam.passingMarks})</p>
                  <p>প্রশ্ন: {exam.questions.length} টি</p>
               </div>

               <div className="flex space-x-2 pt-4 border-t">
                  <button className="flex-1 text-blue-600 bg-blue-50 py-2 rounded text-sm font-bold hover:bg-blue-100">Edit</button>
                  <button className="flex-1 text-gray-600 bg-gray-50 py-2 rounded text-sm font-bold hover:bg-gray-100">Results</button>
               </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminExams;