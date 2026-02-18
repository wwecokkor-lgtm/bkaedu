import React, { useState, useEffect } from 'react';
import { Course } from './types';
import { addCourse, deleteCourse, updateCourse } from './api';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'; // Import firestore functions
import { db } from './firebase'; // Import db instance
import AdminCourseEditor from './AdminCourseEditor';

const AdminCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingCourse, setEditingCourse] = useState<Course | undefined>(undefined);
  const [loading, setLoading] = useState(true); // Start true

  // --- REALTIME LISTENER ---
  useEffect(() => {
    // Query courses ordered by creation time (descending) so newest appears first
    const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const courseData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Course));
      setCourses(courseData);
      setLoading(false);
    }, (error) => {
      console.error("Realtime fetch error:", error);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleCreateNew = () => {
    setEditingCourse(undefined);
    setView('editor');
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setView('editor');
  };

  const handleDelete = async (id: string) => {
    if (confirm("আপনি কি নিশ্চিত এই কোর্সটি এবং এর সমস্ত ডাটা মুছে ফেলতে চান?")) {
      await deleteCourse(id);
      // No need to call fetchCourses(), onSnapshot handles update
    }
  };

  const handleSaveCourse = async (courseData: Omit<Course, 'id'>) => {
    if (editingCourse) {
      // Update
      await updateCourse(editingCourse.id, courseData);
    } else {
      // Create
      await addCourse(courseData);
    }
    // Switch back to list immediately; onSnapshot will update the UI
    setView('list');
  };

  if (view === 'editor') {
    return (
      <AdminCourseEditor 
        initialData={editingCourse} 
        onSave={handleSaveCourse} 
        onCancel={() => setView('list')} 
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h2 className="text-xl md:text-2xl font-bold text-gray-800">কোর্স তালিকা</h2>
           <p className="text-gray-500 text-sm">আপনার সমস্ত কোর্স এখানে ম্যানেজ করুন</p>
        </div>
        <button 
          onClick={handleCreateNew} 
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow-md flex items-center transition w-full md:w-auto justify-center"
        >
          <i className="fas fa-plus mr-2"></i> নতুন কোর্স
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            <i className="fas fa-spinner fa-spin mr-2"></i> লোড হচ্ছে...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 md:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">কোর্স ইনফো</th>
                  <th className="px-4 md:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">মূল্য / স্ট্যাটাস</th>
                  <th className="px-4 md:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">এনরোলমেন্ট</th>
                  <th className="px-4 md:px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map(course => (
                  <tr key={course.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-14 md:h-12 md:w-16 flex-shrink-0">
                          <img className="h-full w-full rounded object-cover" src={course.thumbnailUrl || 'https://via.placeholder.com/150'} alt="" />
                        </div>
                        <div className="ml-3 md:ml-4">
                          <div className="text-sm font-bold text-gray-900 truncate max-w-[150px] md:max-w-xs" title={course.title}>{course.title}</div>
                          <div className="text-xs text-gray-500">{course.category} • {course.level || 'Beginner'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-bold">৳ {course.price}</div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <i className="fas fa-user-graduate mr-1"></i> {course.studentsCount} জন
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button onClick={() => handleEdit(course)} className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded" title="Edit">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button onClick={() => handleDelete(course.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded" title="Delete">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                      কোনো কোর্স পাওয়া যায়নি। নতুন কোর্স তৈরি করুন।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourses;