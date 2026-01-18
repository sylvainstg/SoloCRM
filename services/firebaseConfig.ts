import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDDWULLy0ZdQq7cvRbgJE20Lk6XSFHy5t4",
  authDomain: "solocrm-ee912.firebaseapp.com",
  projectId: "solocrm-ee912",
  storageBucket: "solocrm-ee912.firebasestorage.app",
  messagingSenderId: "115977982975",
  appId: "1:115977982975:web:6581a793402637aea34dca",
  measurementId: "G-WDQ7GGGDF5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Add scopes for Gmail and Calendar
// Note: These will trigger the "Unverified App" warning.
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events.readonly');
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account consent'
});
