import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { UserProfile, UserRole } from './types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string, userEmail: string, userName: string, photoURL: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      let profileData: UserProfile;

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Sanitize data: Ensure arrays are initialized if missing from DB (legacy support)
        profileData = {
            ...data,
            // Fallback for critical array fields to prevent .length errors
            enrolledCourses: data.enrolledCourses || [],
            childrenIds: data.childrenIds || [],
        } as UserProfile;
      } else {
        // Auto-create profile for new Google Sign-In users
        profileData = {
          uid,
          email: userEmail,
          displayName: userName || 'User',
          photoURL: photoURL || '',
          role: UserRole.USER,
          points: 50, // Bonus for joining
          enrolledCourses: [],
          joinDate: Date.now(),
          isBlocked: false,
          status: 'active',
          isVerified: true // Google Sign-In users are generally verified
        };
        try {
            await setDoc(docRef, profileData);
        } catch (writeErr: any) {
            console.error("Failed to create user profile in Firestore:", writeErr);
        }
      }

      // --- SUPER ADMIN FIX ---
      // নির্দিষ্ট ইমেইলকে স্বয়ংক্রিয়ভাবে অ্যাডমিন রোল দেওয়া হচ্ছে
      if (userEmail === 'fffgamer066@gmail.com' && profileData.role !== UserRole.ADMIN) {
          console.log(`Promoting ${userEmail} to ADMIN...`);
          profileData.role = UserRole.ADMIN;
          // ডাটাবেসে রোল আপডেট করুন
          try {
            await setDoc(docRef, { role: UserRole.ADMIN }, { merge: true });
          } catch (e) {
            console.error("Failed to promote user:", e);
          }
      }
      // -----------------------

      // Security check: If blocked, force logout
      if (profileData.isBlocked) {
          await auth.signOut();
          setUserProfile(null);
          setCurrentUser(null);
          alert("আপনার অ্যাকাউন্টটি সাময়িকভাবে বন্ধ করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।");
          return;
      }
      
      setUserProfile(profileData);

    } catch (error: any) {
      console.error("Error fetching profile:", error);
      // Fallback for ANY error (offline, permission, timeout) to allow UI to render
      const fallbackProfile: UserProfile = {
          uid,
          email: userEmail,
          displayName: userName || 'User (Offline)',
          photoURL: photoURL || '',
          role: userEmail === 'fffgamer066@gmail.com' ? UserRole.ADMIN : UserRole.USER, // Offline admin check
          points: 0,
          enrolledCourses: [],
          joinDate: Date.now(),
          isBlocked: false,
          status: 'active',
          isVerified: false
      };
      setUserProfile(fallbackProfile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchUserProfile(user.uid, user.email || '', user.displayName || '', user.photoURL || '');
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // Logic handled by onAuthStateChanged
    } catch (error) {
      console.error("Google Login Error", error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser.uid, currentUser.email || '', currentUser.displayName || '', currentUser.photoURL || '');
    }
  };

  const logout = async () => {
    await auth.signOut();
    setCurrentUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, refreshProfile, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};