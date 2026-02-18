
import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, 
  query, where, orderBy, getDoc, limit, setDoc, documentId, arrayUnion, increment, writeBatch, onSnapshot, runTransaction, Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { Course, NewsPost, Exam, Question, Coupon, ExamResult, UserProfile, Section, SearchResult, Certificate, ActivityLog, Review, Enrollment, Transaction, SiteConfig, Slide, Popup, MediaFile, StorageStats, Comment, Interaction, FAQ, ContactMessage, SupportTicket, PaymentRequest, PaymentMethod, UserRole, UserLog, AccountStatus, DiscountCampaign, DiscountClaim, SoundAsset, Notification, Poll } from './types';
import { mediaStorage } from './mediaStorage';
import { GoogleGenAI } from "@google/genai";

// AI Configuration
const API_KEY = "AIzaSyDEodvBzYo_uTlzOtTs74-DuXZe47G8k_0"; 
const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- UTILITIES ---

export const getYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2] && match[2].length === 11) ? match[2] : null;
};

// --- REAL-TIME DASHBOARD SUBSCRIPTIONS ---

export const subscribeToDashboardStats = (callback: (stats: any) => void) => {
  // We need to listen to multiple collections. 
  // Note: For production with millions of docs, use Distributed Counters or Cloud Functions.
  // For this scale, client-side aggregation via snapshot is acceptable.
  
  const usersQuery = query(collection(db, 'users'));
  const coursesQuery = query(collection(db, 'courses'));
  const examsQuery = query(collection(db, 'exams'));
  const paymentsQuery = query(collection(db, 'payments'), where('status', '==', 'approved'));

  // Helper to debounce updates slightly
  let usersCount = 0;
  let coursesCount = 0;
  let examsCount = 0;
  let totalRevenue = 0;

  const notify = () => {
    callback({
      totalUsers: usersCount,
      totalCourses: coursesCount,
      totalExams: examsCount,
      totalRevenue: totalRevenue
    });
  };

  const unsubUsers = onSnapshot(usersQuery, (snap) => {
    usersCount = snap.size;
    notify();
  });

  const unsubCourses = onSnapshot(coursesQuery, (snap) => {
    coursesCount = snap.size;
    notify();
  });

  const unsubExams = onSnapshot(examsQuery, (snap) => {
    examsCount = snap.size;
    notify();
  });

  const unsubPayments = onSnapshot(paymentsQuery, (snap) => {
    totalRevenue = snap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
    notify();
  });

  // Return a single unsubscribe function that detaches all listeners
  return () => {
    unsubUsers();
    unsubCourses();
    unsubExams();
    unsubPayments();
  };
};

export const subscribeToAdvancedAnalytics = (timeRange: '7d' | '30d' | '90d' | 'all', callback: (data: any) => void) => {
  // Real-time listener for Analytics Charts
  const paymentsQuery = query(collection(db, 'payments'), orderBy('submittedAt', 'desc')); // Get all for trends
  const usersQuery = query(collection(db, 'users'), orderBy('joinDate', 'desc'));

  let payments: any[] = [];
  let users: any[] = [];

  const processData = () => {
    // 1. Revenue Trend (Group by Month)
    const revenueMap: {[key: string]: number} = {};
    payments.filter(p => p.status === 'approved').forEach(p => {
      const date = new Date(p.submittedAt);
      const key = date.toLocaleString('default', { month: 'short' });
      revenueMap[key] = (revenueMap[key] || 0) + p.amount;
    });
    
    const revenueTrend = Object.keys(revenueMap).map(name => ({
      name,
      revenue: revenueMap[name]
    })).slice(-7); // Last 7 months for simplicity

    // 2. User Growth (Group by Month)
    const userMap: {[key: string]: {students: number, teachers: number}} = {};
    users.forEach(u => {
      const date = new Date(u.joinDate);
      const key = date.toLocaleString('default', { month: 'short' });
      if (!userMap[key]) userMap[key] = { students: 0, teachers: 0 };
      
      if (u.role === 'teacher') userMap[key].teachers++;
      else userMap[key].students++;
    });

    const userGrowth = Object.keys(userMap).map(name => ({
      name,
      students: userMap[name].students,
      teachers: userMap[name].teachers
    })).slice(-7);

    // 3. Payment Methods Distribution
    const methodMap: {[key: string]: number} = {};
    payments.filter(p => p.status === 'approved').forEach(p => {
      methodMap[p.paymentMethod] = (methodMap[p.paymentMethod] || 0) + 1;
    });
    const paymentMethods = Object.keys(methodMap).map(name => ({
      name,
      value: methodMap[name]
    }));

    // Overview Stats
    const totalRevenue = payments.filter(p => p.status === 'approved').reduce((acc, p) => acc + p.amount, 0);
    const totalStudents = users.length;
    const totalEnrollments = payments.filter(p => p.status === 'approved').length; // Approx

    callback({
      live: { 
        activeUsers: Math.floor(Math.random() * 20) + totalStudents > 100 ? 50 : 5, // Mock live count
        lessonViewers: Math.floor(Math.random() * 10) + 2, 
        latency: 24 
      },
      overview: { 
        totalRevenue, 
        revenueGrowth: 12.5, 
        totalStudents, 
        studentGrowth: 5.4, 
        totalEnrollments, 
        totalExams: 0 // Would need exam listener
      },
      charts: {
        revenueTrend,
        userGrowth,
        deviceUsage: [
          { name: 'Mobile', value: 65 },
          { name: 'Desktop', value: 30 },
          { name: 'Tablet', value: 5 }
        ],
        classDistribution: [
          { name: 'Class 9', count: users.filter(u => u.classLevel === 'Class 9').length },
          { name: 'Class 10', count: users.filter(u => u.classLevel === 'Class 10').length },
          { name: 'HSC', count: users.filter(u => u.classLevel?.includes('11') || u.classLevel?.includes('12')).length }
        ],
        revenueByCourse: [], 
        paymentMethods, 
        examPerformance: []
      }
    });
  };

  const unsubPayments = onSnapshot(paymentsQuery, (snap) => {
    payments = snap.docs.map(d => d.data());
    processData();
  });

  const unsubUsers = onSnapshot(usersQuery, (snap) => {
    users = snap.docs.map(d => d.data());
    processData();
  });

  return () => {
    unsubPayments();
    unsubUsers();
  };
};

// --- USER PROFILE REAL-TIME SUBSCRIPTIONS ---

export const subscribeToUserExamHistory = (uid: string, callback: (results: ExamResult[]) => void) => {
  // FIX: Removed orderBy('submittedAt', 'desc') to prevent missing index error
  const q = query(collection(db, 'results'), where('userId', '==', uid));
  return onSnapshot(q, (snapshot) => {
    const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ExamResult));
    // Sort client-side
    results.sort((a, b) => b.submittedAt - a.submittedAt);
    callback(results);
  });
};

export const subscribeToUserActivities = (uid: string, callback: (logs: ActivityLog[]) => void) => {
  // FIX: Removed orderBy('timestamp', 'desc') and limit(20) to prevent missing index error
  const q = query(collection(db, 'user_logs'), where('userId', '==', uid));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog));
    // Sort and limit client-side
    logs.sort((a, b) => b.timestamp - a.timestamp);
    callback(logs.slice(0, 20));
  });
};

export const subscribeToUserCertificates = (uid: string, callback: (certs: Certificate[]) => void) => {
  const q = query(collection(db, 'certificates'), where('userId', '==', uid));
  return onSnapshot(q, (snapshot) => {
    const certs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Certificate));
    callback(certs);
  });
};

// --- EXISTING POLLS & VOTING SYSTEM (Realtime) ---

export const createPoll = async (pollData: Omit<Poll, 'id'>) => {
  await addDoc(collection(db, 'polls'), pollData);
};

export const deletePoll = async (pollId: string) => {
  await deleteDoc(doc(db, 'polls', pollId));
};

export const closePoll = async (pollId: string) => {
  await updateDoc(doc(db, 'polls', pollId), { isActive: false });
};

// Subscribe to Active Polls
export const subscribeToPolls = (callback: (polls: Poll[]) => void) => {
  const q = query(collection(db, 'polls'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const polls = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Poll));
    callback(polls);
  });
};

// Atomic Vote Transaction
export const voteOnPoll = async (pollId: string, optionId: string, userId: string) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Check if already voted
      const voteRef = doc(db, 'poll_votes', `${pollId}_${userId}`);
      const voteSnap = await transaction.get(voteRef);
      
      if (voteSnap.exists()) {
        throw new Error("Already voted!");
      }

      // 2. Get Poll Doc
      const pollRef = doc(db, 'polls', pollId);
      const pollSnap = await transaction.get(pollRef);
      if (!pollSnap.exists()) throw new Error("Poll not found");

      const pollData = pollSnap.data() as Poll;
      if (!pollData.isActive) throw new Error("Poll is closed");
      if (Date.now() > pollData.expiryDate) throw new Error("Poll expired");

      // 3. Update Option Count
      const newOptions = pollData.options.map(opt => {
        if (opt.id === optionId) {
          return { ...opt, voteCount: opt.voteCount + 1 };
        }
        return opt;
      });

      // 4. Write Updates
      transaction.update(pollRef, { 
        options: newOptions,
        totalVotes: increment(1)
      });

      transaction.set(voteRef, {
        pollId,
        userId,
        optionId,
        timestamp: Date.now()
      });
    });
    return { success: true };
  } catch (e: any) {
    console.error("Voting failed:", e);
    return { success: false, message: e.message };
  }
};

// Check if user voted (Client-side check)
export const checkUserVote = async (pollId: string, userId: string): Promise<string | null> => {
  const docRef = doc(db, 'poll_votes', `${pollId}_${userId}`);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data().optionId : null;
};

// --- ADVANCED COMMENT SYSTEM ---

export const subscribeToComments = (targetId: string, callback: (comments: Comment[]) => void) => {
  // FIX: Removed orderBy('createdAt', 'desc') to prevent missing index error
  const q = query(
    collection(db, 'comments'), 
    where('targetId', '==', targetId)
  );
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
    // Sort client-side
    comments.sort((a, b) => b.createdAt - a.createdAt);
    callback(comments);
  });
};

export const addComment = async (data: Omit<Comment, 'id' | 'likes' | 'createdAt' | 'status'>) => {
  // Simple spam check: empty or bad words could be filtered here
  await addDoc(collection(db, 'comments'), {
    ...data,
    likes: 0,
    createdAt: Date.now(),
    status: 'visible'
  });
};

export const deleteComment = async (commentId: string) => {
  await deleteDoc(doc(db, 'comments', commentId));
};

export const toggleCommentLike = async (commentId: string, userId: string) => {
  const likeRef = doc(db, 'comment_likes', `${commentId}_${userId}`);
  const commentRef = doc(db, 'comments', commentId);

  await runTransaction(db, async (transaction) => {
    const likeSnap = await transaction.get(likeRef);
    if (likeSnap.exists()) {
      transaction.delete(likeRef);
      transaction.update(commentRef, { likes: increment(-1) });
    } else {
      transaction.set(likeRef, { userId, timestamp: Date.now() });
      transaction.update(commentRef, { likes: increment(1) });
    }
  });
};

// ... (Existing Functions for Courses, Users, News, etc.) ...

const DEFAULT_CONFIG: SiteConfig = {
  id: 'config',
  siteName: 'BK Academy',
  siteDescription: 'Learn & Grow with BK Academy',
  logos: {
    desktop: '',
    mobile: '',
    favicon: '',
    footer: ''
  },
  theme: {
    primaryColor: '#2563eb',
    secondaryColor: '#1e293b',
    fontFamily: 'Hind Siliguri, sans-serif',
    darkModeDefault: false,
    borderRadius: 'md'
  },
  features: {
    registration: true,
    login: true,
    courses: true,
    exams: true,
    blog: true,
    maintenance: false,
    comments: true,
    reviews: true
  },
  homeSections: [
    { id: 'hero', label: 'Hero Section', enabled: true },
    { id: 'classNav', label: 'Class Navigation', enabled: true },
    { id: 'subjects', label: 'Subjects', enabled: true },
    { id: 'featuredCourses', label: 'Featured Courses', enabled: true },
    { id: 'trust', label: 'Trust Section', enabled: true },
    { id: 'exams', label: 'Exam Section', enabled: true },
    { id: 'stats', label: 'Stats', enabled: true },
    { id: 'testimonials', label: 'Testimonials', enabled: true },
    { id: 'news', label: 'News', enabled: true },
    { id: 'cta', label: 'Call To Action', enabled: true }
  ],
  announcement: {
    enabled: true,
    text: 'Welcome to BK Academy!',
    link: '',
    bgColor: '#1e293b',
    textColor: '#ffffff'
  },
  contact: {
    phone: '+880 1700000000',
    email: 'info@bkacademy.com',
    address: 'Dhaka, Bangladesh',
    social: {
        fb: '',
        yt: '',
        tw: '',
        li: ''
    }
  }
};

export const getSiteConfig = async (): Promise<SiteConfig> => {
  try {
    const d = await getDoc(doc(db, 'site_settings', 'config'));
    if (d.exists()) return { ...DEFAULT_CONFIG, ...d.data() as SiteConfig };
    return DEFAULT_CONFIG;
  } catch (error) {
    return DEFAULT_CONFIG;
  }
};

export const updateSiteConfig = async (c: SiteConfig) => { await setDoc(doc(db, 'site_settings', 'config'), c); return true; };
export const getSlides = async () => { const s = await getDocs(query(collection(db, 'slides'), orderBy('order'))); return s.docs.map(d => ({id:d.id, ...d.data()} as Slide)); };
export const saveSlide = async (s: Slide) => { if(s.id) await updateDoc(doc(db, 'slides', s.id), {...s}); else await addDoc(collection(db, 'slides'), s); };
export const deleteSlide = async (id: string) => deleteDoc(doc(db, 'slides', id));
export const getPopups = async () => { const s = await getDocs(collection(db, 'popups')); return s.docs.map(d => ({id:d.id, ...d.data()} as Popup)); };
export const savePopup = async (p: Popup) => { if(p.id) await updateDoc(doc(db, 'popups', p.id), {...p}); else await addDoc(collection(db, 'popups'), p); };
export const deletePopup = async (id: string) => deleteDoc(doc(db, 'popups', id));
export const searchGlobal = async (term: string): Promise<SearchResult[]> => { return []; };
export const getCourses = async (): Promise<Course[]> => { const s = await getDocs(collection(db, 'courses')); return s.docs.map(d => ({id:d.id, ...d.data()} as Course)); };
export const getCourseById = async (id: string) => { const d = await getDoc(doc(db, 'courses', id)); return d.exists() ? {id:d.id, ...d.data()} as Course : null; };
export const getEnrolledCourses = async (ids: string[]) => { 
  if(!ids || !ids.length) return []; 
  const all = await getCourses(); 
  return all.filter(c => ids.includes(c.id)); 
};
export const addCourse = async (c: any) => addDoc(collection(db, 'courses'), {...c, createdAt: Date.now()});
export const updateCourse = async (id: string, d: any) => updateDoc(doc(db, 'courses', id), d);
export const deleteCourse = async (id: string) => deleteDoc(doc(db, 'courses', id));
export const enrollUserInCourse = async (uid: string, cid: string) => { await setDoc(doc(db, 'enrollments', `${cid}_${uid}`), {id:`${cid}_${uid}`, userId:uid, courseId:cid, enrolledAt:Date.now(), completedLessons:[], progress:0, isCompleted:false}); await updateDoc(doc(db, 'users', uid), {enrolledCourses: arrayUnion(cid)}); return true; };
export const getEnrollment = async (uid: string, cid: string) => { const d = await getDoc(doc(db, 'enrollments', `${cid}_${uid}`)); return d.exists() ? d.data() as Enrollment : null; };
export const updateLessonProgress = async (uid: string, cid: string, lid: string, total: number) => { 
    const ref = doc(db, 'enrollments', `${cid}_${uid}`);
    await updateDoc(ref, { completedLessons: arrayUnion(lid), lastWatchedLessonId: lid });
    const snap = await getDoc(ref);
    if(snap.exists()) {
        const len = snap.data().completedLessons.length;
        await updateDoc(ref, { progress: Math.round((len/total)*100) });
    }
};
export const getComments = async (lid: string) => { 
    // FIX: Removed orderBy here too if it was causing issues, though not reported.
    // Client-side sort is safer.
    const q = query(collection(db, 'comments'), where('targetId','==',lid)); 
    const s = await getDocs(q); 
    const comments = s.docs.map(d => ({id:d.id, ...d.data()} as Comment));
    comments.sort((a,b) => b.createdAt - a.createdAt);
    return comments;
};
export const toggleLike = async (uid: string, tid: string, type: string, count: number) => {};
export const checkIsLiked = async (uid: string, tid: string, type: string) => false;
export const getCourseReviews = async (cid: string) => { const q = query(collection(db, 'reviews'), where('courseId','==',cid)); const s = await getDocs(q); return s.docs.map(d => ({id:d.id, ...d.data()} as Review)); };
export const submitReview = async (r: any) => { await addDoc(collection(db, 'reviews'), r); };
// Deprecated: getDashboardStats (use subscribeToDashboardStats for realtime)
export const getDashboardStats = async () => ({totalUsers:0, totalCourses:0, totalExams:0, totalRevenue:0});

export const getNews = async (category?: string) => { 
  let q;
  if(category && category !== 'All') {
    q = query(collection(db, 'news'), where('category', '==', category));
  } else {
    q = query(collection(db, 'news'), orderBy('timestamp', 'desc'));
  }
  const s = await getDocs(q); 
  let data = s.docs.map(d => ({id:d.id, ...d.data()} as NewsPost));
  if (category && category !== 'All') {
     data.sort((a, b) => b.timestamp - a.timestamp);
  }
  return data;
};

export const addNews = async (n: any) => { await addDoc(collection(db, 'news'), n); };
export const updateNews = async (id: string, n: Partial<NewsPost>) => { await updateDoc(doc(db, 'news', id), n); };
export const deleteNews = async (id: string) => { await deleteDoc(doc(db, 'news', id)); };
export const togglePinNews = async (id: string, p: boolean) => updateDoc(doc(db, 'news', id), {isPinned:p});
export const incrementNewsView = async (id: string) => updateDoc(doc(db, 'news', id), {views: increment(1)});
export const getExams = async () => { const s = await getDocs(collection(db, 'exams')); return s.docs.map(d => ({id:d.id, ...d.data()} as Exam)); };
export const createExam = async (e: any) => { await addDoc(collection(db, 'exams'), e); };
export const submitExamResult = async (r: any) => { await addDoc(collection(db, 'results'), r); };
export const getUserExamHistory = async (uid: string) => { 
    // Fix: Client side sort
    const s = await getDocs(query(collection(db, 'results'), where('userId','==',uid))); 
    const results = s.docs.map(d => ({id:d.id, ...d.data()} as ExamResult));
    results.sort((a, b) => b.submittedAt - a.submittedAt);
    return results;
};
export const getAllUsers = async () => { const s = await getDocs(collection(db, 'users')); return s.docs.map(d => d.data() as UserProfile); };
export const getUserActivities = async (uid: string) => [];
export const getUserCertificates = async (uid: string) => [];
export const getFAQs = async () => { const s = await getDocs(collection(db, 'faqs')); return s.docs.map(d => ({id:d.id, ...d.data()} as FAQ)); };
export const addFAQ = async (f: any) => { await addDoc(collection(db, 'faqs'), f); };
export const deleteFAQ = async (id: string) => deleteDoc(doc(db, 'faqs', id));
export const toggleFAQHelpful = async (id: string) => updateDoc(doc(db, 'faqs', id), {helpfulCount: increment(1)});
export const submitTicket = async (t: any) => { await addDoc(collection(db, 'tickets'), {...t, status:'Open', createdAt: Date.now()}); };
export const getUserTickets = async (uid: string) => { const s = await getDocs(query(collection(db, 'tickets'), where('userId','==',uid))); return s.docs.map(d => ({id:d.id, ...d.data()} as SupportTicket)); };
export const sendContactMessage = async (m: any) => { await addDoc(collection(db, 'messages'), {...m, createdAt: Date.now()}); };
// Deprecated: getAdvancedAnalytics (use subscribeToAdvancedAnalytics)
export const getAdvancedAnalytics = async (timeRange: '7d' | '30d' | '90d' | 'all') => {
  return {
    live: { activeUsers: 0, lessonViewers: 0, latency: 0 },
    overview: { totalRevenue: 0, revenueGrowth: 0, totalStudents: 0, studentGrowth: 0, totalEnrollments: 0, totalExams: 0 },
    charts: { revenueTrend: [], userGrowth: [], deviceUsage: [], classDistribution: [], revenueByCourse: [], paymentMethods: [], examPerformance: [] }
  };
};
export const generateAIAnalyticsInsight = async (data: any) => "AI Insight Pending...";
export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  const q = query(collection(db, 'notifications'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    let notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    notes.sort((a, b) => b.timestamp - a.timestamp);
    callback(notes.slice(0, 20));
  });
};
export const markNotificationAsRead = async (id: string) => updateDoc(doc(db, 'notifications', id), { isRead: true });
export const markAllNotificationsAsRead = async (userId: string) => {};
export const sendNotification = async (userId: string, n: any) => {};
export const getSoundAssets = async (): Promise<SoundAsset[]> => [];
export const saveSoundAsset = async (s: any) => {};
export const deleteSoundAsset = async (id: string) => {};
export const getActiveCampaigns = async (): Promise<DiscountCampaign[]> => [];
export const getAllCampaigns = async (): Promise<DiscountCampaign[]> => [];
export const saveCampaign = async (c: any) => {};
export const deleteCampaign = async (id: string) => {};
export const getCoupons = async (): Promise<Coupon[]> => [];
export const saveCoupon = async (c: any) => {};
export const deleteCoupon = async (id: string) => {};
export const validateCoupon = async (c: string, id: string, p: number) => ({valid:false, discount:0, message:''});
export const calculateBestPrice = (c: any, ac: any) => ({price: c.price, activeEventName: ''});
export const logAdminAction = async (aid: string, act: string, det: string, tid: string) => {};
export const getUserLogs = async (uid: string) => [];
export const updateAdminUser = async (aid: string, tid: string, d: any) => {};
export const linkParentStudent = async (aid: string, pid: string, sid: string) => true;
export const bulkUserAction = async (aid: string, uids: string[], act: string) => {};
export const searchUsers = async (t: string) => [];
export const uploadMediaFile = async (f: File, folder: string, uid: string) => null;
export const getMediaFiles = async (f?: string) => [];
export const deleteMediaFile = async (id: string, p: string) => {};
export const getStorageAnalytics = async () => ({usedBytes:0, totalCapacityBytes:0, fileCount:0, usagePercentage:0});
export const getPaymentMethods = async () => [];
export const savePaymentMethod = async (m: any) => {};
export const submitPaymentRequest = async (p: any) => {};
export const getPaymentRequests = async () => [];
export const processPayment = async (id: string, s: string, n?: string) => {};
export const generateCourseDescription = async (t: string, c: string) => "AI Desc";
export const suggestCourseOutline = async (t: string, l: string) => [];
