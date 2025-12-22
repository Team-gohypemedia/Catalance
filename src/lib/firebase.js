// Firebase configuration - Lazy initialization for Google Sign-In and Notifications
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut,
  getRedirectResult
} from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// VAPID key for push notifications from environment variable
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;


// Lazy initialization - only initialize when needed
let app = null;
let auth = null;
let googleProvider = null;
let messaging = null;

const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    // Add additional scopes
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
  }
  return { app, auth, googleProvider };
};

// Initialize Firebase Cloud Messaging
const initializeMessaging = () => {
  if (!messaging && typeof window !== 'undefined') {
    const { app } = initializeFirebase();
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.warn("Firebase messaging not supported:", error);
    }
  }
  return messaging;
};

// Register service worker and send config
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      
      // Send Firebase config to the service worker
      if (registration.active) {
        registration.active.postMessage({
          type: 'FIREBASE_CONFIG',
          config: firebaseConfig
        });
      }
      
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }
  return null;
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return null;
    }

    // Register service worker first
    await registerServiceWorker();

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const fcmMessaging = initializeMessaging();
      if (!fcmMessaging) return null;

      // Get registration token
      const token = await getToken(fcmMessaging, { 
        vapidKey: VAPID_KEY 
      });
      
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback) => {
  const fcmMessaging = initializeMessaging();
  if (!fcmMessaging) return () => {};

  return onMessage(fcmMessaging, (payload) => {
    console.log('Foreground message received:', payload);
    
    // Show notification manually for foreground messages
    if (payload.notification) {
      const { title, body, icon } = payload.notification;
      
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: icon || '/favicon.ico',
          badge: '/favicon.ico'
        });
      }
    }
    
    if (callback) callback(payload);
  });
};

// Google Sign In with popup - uses a workaround for COOP issues
export const signInWithGoogle = async () => {
  try {
    const { auth, googleProvider } = initializeFirebase();
    
    // Set custom parameters to help with popup blocking
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed. Please try again.');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked. Please allow popups for this site.');
    }
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in was cancelled. Please try again.');
    }
    
    throw error;
  }
};

// Sign Out
export const firebaseSignOut = async () => {
  try {
    if (auth) {
      await signOut(auth);
    }
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

// Check for redirect result (call this on page load if using redirect flow)
export const checkRedirectResult = async () => {
  try {
    const { auth } = initializeFirebase();
    const result = await getRedirectResult(auth);
    if (result?.user) {
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Redirect result error:", error);
    return null;
  }
};

export { initializeFirebase, initializeMessaging };
