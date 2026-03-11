import { initializeApp } from "firebase/app";
import { ReCaptchaV3Provider, initializeAppCheck } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAHxytsfKGeIgMAy-d4-RXAzDUJx2UUNao",
  authDomain: "insurance-analytics-d1a8c.firebaseapp.com",
  projectId: "insurance-analytics-d1a8c",
  storageBucket: "insurance-analytics-d1a8c.firebasestorage.app",
  messagingSenderId: "917244923652",
  appId: "1:917244923652:web:a91c9332eef0585caeca51",
  measurementId: "G-6RJG5NSRQN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});

// Export services
export { app, appCheck };
export const auth = getAuth(app);
export const db = getFirestore(app, "database");