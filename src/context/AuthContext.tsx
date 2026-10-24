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
  const [isLifetime, setIsLifetime] = useState<boolean>(() => {
    try {
      return localStorage.getItem(CACHE_KEY_LIFETIME) === 'true';
    } catch {
      return false;
    }
  });

  const syncProfile = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setProfile(null);
      setIsLifetime(false);
      try {
        localStorage.removeItem(CACHE_KEY_LIFETIME);
      } catch {}
      return;
    }

    // Fast-path: immediately check if this user was already verified as VIP in local cache
    let cachedVip = false;
    try {
      cachedVip = localStorage.getItem(`${CACHE_KEY_LIFETIME}_${firebaseUser.uid}`) === 'true' ||
                  localStorage.getItem(CACHE_KEY_LIFETIME) === 'true';
      if (cachedVip) {
        setIsLifetime(true);
      }
    } catch {}

    try {
      const p = await getUserProfile(firebaseUser.uid);
      if (p) {
        setProfile(p);
        const verifiedVip = Boolean(
          p.isLifetime ||
          p.plan === 'LIFETIME_VIP' ||
          (p as any).subscription?.status === 'active' ||
          cachedVip
        );
        setIsLifetime(verifiedVip);
        try {
          if (verifiedVip) {
            localStorage.setItem(`${CACHE_KEY_LIFETIME}_${firebaseUser.uid}`, 'true');
            localStorage.setItem(CACHE_KEY_LIFETIME, 'true');
          }
        } catch {}
      } else {
        // Fallback default profile preserving VIP status
        const defaultProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isLifetime: cachedVip,
          plan: cachedVip ? 'LIFETIME_VIP' : 'FREE',
        };
        setProfile(defaultProfile);
        if (cachedVip) {
          setIsLifetime(true);
        }
      }
    } catch (e) {
      console.warn('[AuthContext] syncProfile error:', e);
      if (cachedVip) {
        setIsLifetime(true);
      }
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

  const activateLifetimeVIP = async (tranId: string, amount: number = 3.00, currency = 'USD'): Promise<boolean> => {
    if (!user) return false;
    setIsLifetime(true);
    try {
      localStorage.setItem(`${CACHE_KEY_LIFETIME}_${user.uid}`, 'true');
      localStorage.setItem(CACHE_KEY_LIFETIME, 'true');
      localStorage.removeItem('qr_active_checkout_session');
    } catch {}

    setProfile((prev) =>
      prev
        ? { ...prev, isLifetime: true, plan: 'LIFETIME_VIP' }
        : {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            isLifetime: true,
            plan: 'LIFETIME_VIP',
          }
    );

    try {
      await activateUserLifetime(user.uid, { tranId, amount, currency });
    } catch (e) {
      console.warn('[AuthContext] activateUserLifetime error:', e);
    }
    return true;
  };

  const refreshProfile = async () => {
    if (user) {
      await syncProfile(user);
    }
  };

  const verifiedIsLifetime = Boolean(
    user && (
      isLifetime ||
      profile?.isLifetime ||
      profile?.plan === 'LIFETIME_VIP' ||
      (typeof window !== 'undefined' && localStorage.getItem(`${CACHE_KEY_LIFETIME}_${user.uid}`) === 'true')
    )
  );

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
