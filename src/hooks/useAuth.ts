import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import type { TeacherUser } from "../types";
import { getFirebaseServices, hasFirebaseConfig } from "../services/firebase";

const DEMO_TEACHER: TeacherUser = {
  uid: "demo-teacher",
  email: "demo.teacher@example.com",
  displayName: "데모 선생님",
  photoURL: null,
};

export type AuthState = {
  user: TeacherUser | null;
  loading: boolean;
  mode: "firebase" | "demo";
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

export function useAuth(): AuthState {
  const firebaseEnabled = hasFirebaseConfig();
  const services = useMemo(() => getFirebaseServices(), []);
  const [user, setUser] = useState<TeacherUser | null>(
    firebaseEnabled ? null : DEMO_TEACHER,
  );
  const [loading, setLoading] = useState(firebaseEnabled);

  useEffect(() => {
    if (!services) {
      return;
    }

    return onAuthStateChanged(services.auth, (firebaseUser) => {
      setUser(
        firebaseUser
          ? {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            }
          : null,
      );
      setLoading(false);
    });
  }, [services]);

  const signIn = useCallback(async () => {
    if (!services) {
      setUser(DEMO_TEACHER);
      return;
    }

    await signInWithPopup(services.auth, new GoogleAuthProvider());
  }, [services]);

  const signOut = useCallback(async () => {
    if (!services) {
      setUser(null);
      return;
    }

    await firebaseSignOut(services.auth);
  }, [services]);

  return {
    user,
    loading,
    mode: services ? "firebase" : "demo",
    signIn,
    signOut,
  };
}
