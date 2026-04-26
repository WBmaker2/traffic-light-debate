import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

export type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
};

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

let cachedServices: FirebaseServices | null | undefined;

export function hasFirebaseConfig(): boolean {
  return Boolean(readFirebaseConfig());
}

export function getFirebaseServices(): FirebaseServices | null {
  if (cachedServices !== undefined) {
    return cachedServices;
  }

  const config = readFirebaseConfig();
  if (!config) {
    cachedServices = null;
    return cachedServices;
  }

  const app = getApps().length > 0 ? getApps()[0] : initializeApp(config);
  cachedServices = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };

  return cachedServices;
}

function readFirebaseConfig(): FirebaseConfig | null {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  if (Object.values(config).some((value) => !value)) {
    return null;
  }

  return config;
}
