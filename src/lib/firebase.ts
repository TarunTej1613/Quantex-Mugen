import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBp6ZyW7linbw8vAbFaA7t3_B2sDcbb2pY",
  authDomain: "quantex-mugen.firebaseapp.com",
  projectId: "quantex-mugen",
  storageBucket: "quantex-mugen.firebasestorage.app",
  messagingSenderId: "461864203189",
  appId: "1:461864203189:web:cfc4ab5456f7d1cef69ffc",
  measurementId: "G-M50L9HKXT3",
};

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Show all existing accounts present in Google Account Chooser
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export { app, auth, googleProvider };
