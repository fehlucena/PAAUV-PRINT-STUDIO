import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "./firestoreUtils";

interface AppUser {
  uid: string;
  username: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth State Changed:", firebaseUser?.email);
      try {
        if (firebaseUser) {
          // Fetch user data from firestore
          const path = `users/${firebaseUser.uid}`;
          const docRef = doc(db, "users", firebaseUser.uid);
          try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setUser(docSnap.data() as AppUser);
            } else {
              console.log("User doc not found, creating default...");
              // Fallback if user doc doesn't exist
              const newUser: AppUser = {
                uid: firebaseUser.uid,
                username: firebaseUser.email ? firebaseUser.email.split('@')[0] : "admin",
                role: "admin"
              };
              try {
                await setDoc(docRef, newUser);
              } catch (setErr) {
                handleFirestoreError(setErr, OperationType.WRITE, path);
              }
              setUser(newUser);
            }
          } catch (getErr) {
            handleFirestoreError(getErr, OperationType.GET, path);
          }
        } else {
          setUser(null);
        }
      } catch (globalErr) {
        console.error("Global Auth Context Error:", globalErr);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
