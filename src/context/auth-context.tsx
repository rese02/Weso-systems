'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onIdTokenChanged, signInWithEmailAndPassword, signOut, UserCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase.client';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Augment the Firebase User type to include our custom claims
interface User extends FirebaseUser {
  claims: {
    role?: 'agency' | 'hotelier';
    hotelId?: string;
    [key: string]: any;
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idTokenResult = await firebaseUser.getIdTokenResult(true);
        const augmentedUser: User = Object.assign(firebaseUser, {
            claims: idTokenResult.claims
        });
        setUser(augmentedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = (email: string, password: string): Promise<UserCredential> => {
    return signInWithEmailAndPassword(auth, email, password);
  }

  const logout = async () => {
    await signOut(auth);
    // This will trigger the onIdTokenChanged listener, which will set user to null
    // The middleware will then handle redirection based on the route.
    // We can add a fallback redirect here if needed.
    router.push('/hotel/login'); 
  };
  
  const value = {
    user,
    loading,
    signIn,
    logout,
  };
  
  if (loading) {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
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
