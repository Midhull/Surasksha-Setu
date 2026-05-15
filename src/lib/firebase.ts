import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getPerformance } from "firebase/performance";

// TODO: Replace with the firebaseConfig you provide
const firebaseConfig = {
  apiKey: "AIzaSyDQcSG0dW5nFlTj2nrft6f9hg-MjJEG5Qs",
  authDomain: "suraksha-setu-93428.firebaseapp.com",
  projectId: "suraksha-setu-93428",
  storageBucket: "suraksha-setu-93428.firebasestorage.app",
  messagingSenderId: "689826555185",
  appId: "1:689826555185:web:2588a932d45ea48aa97c10"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const perf = typeof window !== 'undefined' ? getPerformance(app) : null;
