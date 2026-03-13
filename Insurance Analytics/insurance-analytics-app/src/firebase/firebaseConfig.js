import { initializeApp } from "firebase/app";
// Only import App Check in production
let ReCaptchaV3Provider, initializeAppCheck;
if (typeof window !== "undefined" && !window.location.hostname.match(/^(localhost|127\.0\.0\.1|::1)$/)) {
  ({ ReCaptchaV3Provider, initializeAppCheck } = require("firebase/app-check"));
}
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

const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const currentHostname = typeof window !== "undefined" ? window.location.hostname : "";
// App Check must be fully disabled for localhost/dev, regardless of site key or Firebase enforcement.
const isLocalDevelopment =
  import.meta.env.DEV || localHosts.has(currentHostname) || currentHostname.endsWith(".local") || currentHostname === "";
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;

let appCheck;

// App Check is NEVER initialized for localhost/dev. Only for real domains in production.
if (
  typeof window !== "undefined" &&
  !window.location.hostname.match(/^(localhost|127\.0\.0\.1|::1)$/) &&
  appCheckSiteKey &&
  ReCaptchaV3Provider &&
  initializeAppCheck
) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn("App Check initialization failed. Continuing without App Check:", error);
    appCheck = undefined;
  }
}

// Export services
export { app, appCheck };
export const auth = getAuth(app);
export const db = getFirestore(app, "database");