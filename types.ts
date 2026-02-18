
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
  USER = 'user' // Fallback/Default
}

export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'banned' | 'pending';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  points: number;
  enrolledCourses: string[];
  
  // Extended Profile
  bio?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  address?: string;
  classLevel?: string; // "Class 1" to "Class 12"
  institution?: string; // School/College Name
  
  // System Status
  status: AccountStatus;
  isVerified: boolean;
  joinDate: number;
  lastLogin?: number;
  isBlocked?: boolean; // Deprecated in favor of status, but kept for legacy support
  
  // Relations
  parentId?: string; // If student
  childrenIds?: string[]; // If parent
  
  // Metadata
  notes?: string; // Admin internal notes
}

export interface UserLog {
  id: string;
  userId: string; // Target user
  action: string; // "ROLE_CHANGE", "BAN", "LOGIN", "EDIT"
  details: string;
  performedBy: string; // Admin UID or "SYSTEM"
  timestamp: number;
  ipAddress?: string;
}

// ... Existing Interfaces ...

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'text' | 'quiz' | 'assignment';
  contentUrl?: string; // Video URL (YouTube) or File URL
  youtubeId?: string; // Extracted ID for embed
  textContent?: string;
  isFreePreview: boolean;
  durationMinutes?: number;
  likesCount?: number;
  viewsCount?: number;
}

export interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Instructor {
  name: string;
  bio: string;
  photoUrl?: string;
  socialLinks?: {
    facebook?: string;
    linkedin?: string;
    website?: string;
  };
}

export interface Course {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  longDescription?: string;
  price: number;
  discountPrice?: number;
  pointsPrice?: number;
  category: string;
  tags?: string[];
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  language?: string;
  thumbnailUrl: string;
  videoUrl?: string;
  isPublished: boolean;
  studentsCount: number;
  sections?: Section[];
  instructor?: Instructor;
  createdAt?: number;
  updatedAt?: number;
  rating?: number;
  totalReviews?: number;
}

export interface Review {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  timestamp: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: number;
  completedLessons: string[];
  progress: number;
  isCompleted: boolean;
  lastWatchedLessonId?: string;
}

export type NewsCategory = 'General' | 'Exam' | 'Result' | 'Scholarship' | 'Admission' | 'Blog' | 'Announcement';

export interface NewsPost {
  id: string;
  title: string;
  content: string; // Rich text or HTML
  slug?: string;
  authorId: string;
  authorName: string;
  timestamp: number;
  updatedAt?: number;
  
  // CMS Features
  category: NewsCategory;
  tags: string[];
  featuredImage?: string;
  status: 'draft' | 'published';
  views: number;
  likes: number;
  isPinned: boolean;
}

// --- EXAM SYSTEM TYPES ---

export type QuestionType = 'MCQ' | 'TrueFalse' | 'ShortAnswer' | 'MultipleSelect';

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  options: string[]; // For MCQ/Multi
  correctOptions: number[]; // Indices of correct options
  correctAnswerText?: string; // For ShortAnswer
  marks: number;
  negativeMarks?: number;
  explanation?: string; // Shown after exam
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  courseId?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  questions: Question[];
  isActive: boolean;
  shuffleQuestions: boolean;
  allowReview: boolean; // Allow reviewing answers after submit
  attemptLimit?: number; // 0 = unlimited
  startDate?: number;
  endDate?: number;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  userName: string;
  startedAt: number;
  submittedAt?: number;
  answers: { [questionId: string]: any }; // optionIndex or text
  score: number;
  status: 'ongoing' | 'completed' | 'abandoned';
  violations: number; // Tab switching count
}

export interface ExamResult extends ExamAttempt {
  // Alias for backward compatibility if needed, essentially same as completed attempt
  totalMarks: number;
  date: number; // mapped from submittedAt
}

// --- DISCOUNT & CAMPAIGN SYSTEM ---

export interface DiscountCampaign {
  id: string;
  name: string; // e.g., "Eid Special"
  type: 'percentage' | 'fixed';
  value: number; // e.g., 20 (%) or 500 (Tk)
  startDate: number;
  endDate: number;
  isActive: boolean;
  applicableCourses: string[]; // 'all' or array of IDs
  bannerUrl?: string;
  minPurchase?: number;
  createdAt: number;
}

export interface Coupon {
  id: string;
  code: string; // e.g., "BK50"
  type: 'percentage' | 'fixed';
  value: number;
  usageLimit: number; // Max times this can be used globally
  usedCount: number;
  expiryDate: number;
  isActive: boolean;
  minPurchase?: number;
  applicableCourses?: string[]; // 'all' or IDs
}

export interface DiscountClaim {
  id: string;
  userId: string;
  campaignId?: string; // If mystery
  couponCode?: string;
  claimedAt: number;
  discountValue: number;
}

// --- SOUND SYSTEM ---

export type SoundCategory = 'ui' | 'notification' | 'lesson' | 'event' | 'alert';
export type SoundTrigger = 'click' | 'hover' | 'success' | 'error' | 'warning' | 'complete' | 'popup' | 'spin' | 'win' | 'notification' | 'tab_switch';

export interface SoundAsset {
  id: string;
  name: string;
  url: string;
  category: SoundCategory;
  trigger: SoundTrigger;
  volume: number; // 0.0 to 1.0
  isEnabled: boolean;
  uploadedAt: number;
}

export interface SoundPreferences {
  masterVolume: number;
  muted: boolean;
  categories: {
    ui: boolean;
    notification: boolean;
    lesson: boolean;
    event: boolean;
    alert: boolean;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  timestamp: number;
  link?: string;
}

export interface SearchResult {
  type: 'course' | 'news' | 'exam';
  id: string;
  title: string;
  subtitle?: string;
  url: string;
}

export interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  issueDate: number;
  certificateUrl: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: number;
  type: 'learning' | 'exam' | 'social' | 'system';
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  date: number;
  paymentMethod: string;
}

export interface PaymentMethod {
  id: string;
  methodName: 'bKash' | 'Nagad' | 'Rocket' | 'Bank';
  accountNumber: string;
  accountType: 'Personal' | 'Agent' | 'Merchant';
  instructions: string;
  qrImageUrl?: string;
  isEnabled: boolean;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  originalAmount?: number;
  discountApplied?: number;
  couponCode?: string;
  paymentMethod: string;
  transactionId: string;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  submittedAt: number;
  approvedAt?: number;
}

export interface SiteConfig {
  id: string;
  siteName: string;
  siteDescription: string;
  logos: {
    desktop: string;
    mobile: string;
    favicon: string;
    footer: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    darkModeDefault: boolean;
    borderRadius: string;
  };
  features: {
    registration: boolean;
    login: boolean;
    courses: boolean;
    exams: boolean;
    blog: boolean;
    maintenance: boolean;
    comments: boolean;
    reviews: boolean;
  };
  homeSections: {
    id: string;
    label: string;
    enabled: boolean;
  }[];
  announcement: {
    enabled: boolean;
    text: string;
    link: string;
    bgColor: string;
    textColor: string;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
    social: {
        fb: string;
        yt: string;
        tw: string;
        li: string;
    }
  }
}

export interface Slide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  order: number;
  isActive: boolean;
}

export interface Popup {
  id: string;
  type: 'welcome' | 'promo' | 'alert' | 'exit';
  title: string;
  content: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  triggerDelay: number;
  isActive: boolean;
  showOnce: boolean;
}

export interface MediaFile {
  id: string;
  originalName: string;
  storedName: string;
  folder: string;
  fullPath: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: number;
}

export interface StorageStats {
  usedBytes: number;
  totalCapacityBytes: number;
  fileCount: number;
  usagePercentage: number;
}

export interface Interaction {
  id: string;
  userId: string;
  targetId: string;
  type: 'like_lesson' | 'like_comment';
}

export interface FAQ {
  id: string;
  category: 'General' | 'Payment' | 'Course' | 'Exam' | 'Account';
  question: string;
  answer: string;
  views: number;
  helpfulCount: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  message: string;
  category: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: number;
  isRead: boolean;
}

// --- NEW TYPES FOR VOTING & COMMENTS ---

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  isActive: boolean;
  expiryDate: number;
  createdAt: number;
  createdBy: string;
}

export interface Comment {
  id: string;
  targetId: string; // CourseID, PollID, or LessonID
  parentId?: string; // For replies
  userId: string;
  userName: string;
  userPhoto?: string;
  userRole?: UserRole;
  text: string;
  likes: number;
  createdAt: number;
  status: 'visible' | 'hidden'; // For moderation
}

export type SiteSettings = SiteConfig;
