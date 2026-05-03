import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import type { FirebaseUser } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { UserStats } from '../types';

interface FirebaseContextType {
  user: FirebaseUser | null;
  loading: boolean;
  userStats: UserStats | null;
  error: string | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionLogged, setSessionLogged] = useState(false);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      // Cleanup previous doc listener
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }
      
      if (firebaseUser) {
        setLoading(true);

        // Log login session once per app instance
        if (!sessionLogged) {
          try {
            await addDoc(collection(db, 'login_sessions'), {
              userId: firebaseUser.uid,
              timestamp: serverTimestamp(),
              userAgent: navigator.userAgent,
              platform: (navigator as any).platform || 'unknown'
            });
            setSessionLogged(true);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, 'login_sessions');
          }
        }

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen for user data
        unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserStats(docSnap.data() as UserStats);
          } else {
            // Initialize user doc if it doesn't exist
            const initialStats: any = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              score: 0,
              co2Saved: 0,
              steps: 0,
              energy: 0,
              points: 0,
              createdAt: serverTimestamp(),
            };
            
            setDoc(userDocRef, initialStats).catch(err => {
              handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`);
            });
          }
          setLoading(false);
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        });
      } else {
        setUserStats(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, loading, userStats, error }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
