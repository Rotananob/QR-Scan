import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  fbSignOut,
  updateProfile,
  getUserProfile,
  activateUserLifetime,
  type User,
  type UserProfile,
} from '../services/firebase';

const CACHE_KEY_LIFETIME = 'qr_scan_lifetime_vip_cached';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLifetime: boolean;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  activateLifetimeVIP: (tranId: string, amount: number, currency?: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // VIP membership state - strictly validated against user authentication and cloud profile
  const [isLifetime, setIsLifetime] = useState<boolean>(false);

  const syncProfile = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setProfile(null);
      setIsLifetime(false);
      try {
        localStorage.removeItem(CACHE_KEY_LIFETIME);
      } catch {}
      return;
    }

    try {
      const p = await getUserProfile(firebaseUser.uid);
      if (p) {
        setProfile(p);
        const verifiedVip = Boolean(p.isLifetime);
        setIsLifetime(verifiedVip);
        try {
          if (verifiedVip) {
            localStorage.setItem(`${CACHE_KEY_LIFETIME}_${firebaseUser.uid}`, 'true');
          } else {
            localStorage.removeItem(`${CACHE_KEY_LIFETIME}_${firebaseUser.uid}`);
            localStorage.removeItem(CACHE_KEY_LIFETIME);
          }
        } catch {}
      } else {
        // Fallback default profile
        const defaultProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isLifetime: false,
        };
        setProfile(defaultProfile);
        setIsLifetime(false);
      }
    } catch (e) {
      console.warn('[AuthContext] syncProfile error:', e);
      setIsLifetime(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      await syncProfile(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncProfile]);

  const signInWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    await syncProfile(cred.user);
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (name && cred.user) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }
    await syncProfile(cred.user);
  };

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await syncProfile(cred.user);
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setUser(null);
    setProfile(null);
    setIsLifetime(false);
    try {
      localStorage.removeItem(CACHE_KEY_LIFETIME);
    } catch {}
  };

  const activateLifetimeVIP = async (tranId: string, amount: number, currency = 'USD'): Promise<boolean> => {
    if (!user) return false;
    const ok = await activateUserLifetime(user.uid, { tranId, amount, currency });
    if (ok) {
      setIsLifetime(true);
      try {
        localStorage.setItem(CACHE_KEY_LIFETIME, 'true');
      } catch {}
      await syncProfile(user);
      return true;
    }
    return false;
  };

  const refreshProfile = async () => {
    if (user) {
      await syncProfile(user);
    }
  };

  const verifiedIsLifetime = Boolean(user && isLifetime && profile?.isLifetime);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLifetime: verifiedIsLifetime,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        activateLifetimeVIP,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
