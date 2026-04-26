import { useCallback, useEffect, useMemo, useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  browserLocalPersistence,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
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
  error: string | null;
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!services) {
      return;
    }

    void getRedirectResult(services.auth).catch((authError: unknown) => {
      setError(formatAuthError(authError));
    });

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
    setError(null);
    if (!services) {
      setUser(DEMO_TEACHER);
      return;
    }

    const provider = createGoogleProvider();

    try {
      await setPersistence(services.auth, browserLocalPersistence);
      await signInWithPopup(services.auth, provider);
    } catch (authError) {
      if (shouldFallbackToRedirect(authError)) {
        await signInWithRedirect(services.auth, provider);
        return;
      }

      setError(formatAuthError(authError));
    }
  }, [services]);

  const signOut = useCallback(async () => {
    setError(null);
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
    error,
    signIn,
    signOut,
  };
}

function createGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function shouldFallbackToRedirect(error: unknown): boolean {
  return (
    error instanceof FirebaseError &&
    [
      "auth/popup-blocked",
      "auth/cancelled-popup-request",
      "auth/operation-not-supported-in-this-environment",
    ].includes(error.code)
  );
}

function formatAuthError(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return "로그인 중 알 수 없는 문제가 발생했습니다.";
  }

  const messages: Record<string, string> = {
    "auth/popup-closed-by-user": "로그인 창이 닫혔습니다. 다시 시도해 주세요.",
    "auth/unauthorized-domain":
      "Firebase Authentication 승인 도메인에 현재 도메인을 추가해 주세요.",
    "auth/configuration-not-found":
      "Firebase Console에서 Authentication과 Google 로그인 제공업체 설정을 확인해 주세요.",
  };

  return messages[error.code] ?? `로그인에 실패했습니다. (${error.code})`;
}
