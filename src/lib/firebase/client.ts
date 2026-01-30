import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDOZZwi0_Eg30_n3l4PNWn5FIHubIbyWYk",
  authDomain: "myratingis-29082.firebaseapp.com",
  projectId: "myratingis-29082",
  storageBucket: "myratingis-29082.firebasestorage.app",
  messagingSenderId: "733334238264",
  appId: "1:733334238264:web:e58caa3fd0f86abd0022cd",
  measurementId: "G-N1BBTYVLV1"
};

// Initialize Firebase (Singleton pattern to avoid multiple instances)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Analytics is optional and only runs on client side
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((yes) => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, googleProvider, analytics };
