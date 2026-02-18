import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { SiteProvider } from './SiteContext';
import { OfflineProvider } from './OfflineContext';
import { SoundProvider } from './SoundContext'; // New Provider
import Layout from './Layout';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import AdminDashboard from './AdminDashboard';
import CourseList from './CourseList';
import CourseDetails from './CourseDetails';
import CoursePlayer from './CoursePlayer';
import NewsFeed from './NewsFeed';
import ExamPortal from './ExamPortal';
import UserProfilePage from './UserProfile';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute'; // Imported PublicRoute
import Support from './Support';
import FAQ from './FAQ';
import Terms from './Terms';
import Privacy from './Privacy';
import Contact from './Contact';
import GlobalPopup from './GlobalPopup';
import { UserRole } from './types';

function App() {
  return (
    <AuthProvider>
      <SiteProvider>
        <OfflineProvider>
          <SoundProvider> 
            <Router>
              <GlobalPopup />
              <Routes>
                {/* Public Routes (Accessible only if NOT logged in) */}
                <Route element={<PublicRoute />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>
                
                <Route path="/learn/:courseId" element={<CoursePlayer />} />
                <Route path="/learn/:courseId/lesson/:lessonId" element={<CoursePlayer />} />

                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="courses" element={<CourseList />} />
                  <Route path="course/:id" element={<CourseDetails />} />
                  <Route path="news" element={<NewsFeed />} />
                  <Route path="exams" element={<ExamPortal />} />
                  
                  <Route path="support" element={<Support />} />
                  <Route path="faqs" element={<FAQ />} />
                  <Route path="terms" element={<Terms />} />
                  <Route path="privacy" element={<Privacy />} />
                  <Route path="contact" element={<Contact />} />
                  
                  <Route element={<ProtectedRoute />}>
                    <Route path="profile" element={<UserProfilePage />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
                    <Route path="admin" element={<AdminDashboard />} />
                  </Route>
                  
                </Route>
              </Routes>
            </Router>
          </SoundProvider>
        </OfflineProvider>
      </SiteProvider>
    </AuthProvider>
  );
}

export default App;