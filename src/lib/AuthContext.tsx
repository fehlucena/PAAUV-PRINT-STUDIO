import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

interface UserData {
  role: 'admin' | 'volunteer';
  name: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Check for bypass
      const isBypass = localStorage.getItem('bypass_admin') === 'true';
      if (isBypass) {
        setUser({ uid: 'admin_bypass', email: 'omnibazar@paauv.system' } as User);
        setUserData({ role: 'admin', name: 'OmniBazar' });
        setLoading(false);
        return;
      }

      if (!currentUser) {
        // Automatic login for OmniBazar
        try {
          await signInWithEmailAndPassword(auth, 'omnibazar@paauv.system', 'omnibazar');
          return; // The auth state change will trigger again
        } catch (error) {
          console.error("Auto login failed, falling back to bypass:", error);
          localStorage.setItem('bypass_admin', 'true');
          setUser({ uid: 'admin_bypass', email: 'omnibazar@paauv.system' } as User);
          setUserData({ role: 'admin', name: 'OmniBazar' });
          setLoading(false);
          return;
        }
      }
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        } else {
          // Default user data if none exists
          setUserData({ role: 'volunteer', name: currentUser.email || 'Usuário' });
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    localStorage.removeItem('bypass_admin');
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
