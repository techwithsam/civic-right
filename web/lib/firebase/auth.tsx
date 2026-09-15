"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

export type UserRole = "citizen" | "government";

export interface CivicUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  state: string;
  lga: string;
}

interface AuthContextType {
  user: User | null;
  civicUser: CivicUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    state: string,
    lga: string
  ) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [civicUser, setCivicUser] = useState<CivicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (snap.exists()) setCivicUser(snap.data() as CivicUser);
      } else {
        setCivicUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    state: string,
    lga: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const civicData: CivicUser = {
      uid: cred.user.uid,
      name,
      email,
      role,
      state,
      lga,
    };
    await setDoc(doc(db, "users", cred.user.uid), {
      ...civicData,
      createdAt: serverTimestamp(),
    });
    setCivicUser(civicData);
  };

  const logOut = async () => {
    await signOut(auth);
    setCivicUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, civicUser, loading, signIn, signUp, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
