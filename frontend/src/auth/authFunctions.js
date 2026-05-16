/**
 * Firebase Authentication Functions
 * Handles: Google, Facebook, Email, and Phone authentication
 * 
 * Usage:
 * import { loginWithGoogle, loginWithFacebook, sendPhoneOTP } from '../auth/authFunctions';
 */

import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Handle Firebase Auth Errors
 * Converts error codes to user-friendly messages
 */
const getErrorMessage = (errorCode) => {
  const errors = {
    'auth/api-key-not-valid': '⚠️ Firebase API Key error. Check your .env.local file.',
    'auth/invalid-client-id': '⚠️ Google OAuth not configured properly in Firebase Console.',
    'auth/unauthorized-domain': '⚠️ Your domain is not authorized. Add it in Firebase Console.',
    'auth/user-not-found': 'User not found. Try signing up first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'Email already registered. Please sign in.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/popup-closed-by-user': 'Login cancelled. Please try again.',
    'auth/operation-not-allowed': 'This login method is not enabled.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
  };
  
  return errors[errorCode] || `Login failed: ${errorCode}`;
};

/**
 * ===== GOOGLE LOGIN =====
 */
export async function loginWithGoogle() {
  try {
    console.log('🔵 Starting Google login...');
    
    const provider = new GoogleAuthProvider();
    
    // Request specific scopes (optional)
    provider.addScope('profile');
    provider.addScope('email');
    
    const result = await signInWithPopup(auth, provider);
    
    console.log('✅ Google login successful!');
    console.log('User:', {
      uid: result.user.uid,
      email: result.user.email,
      name: result.user.displayName,
      photoURL: result.user.photoURL,
    });
    
    return result.user;
  } catch (error) {
    console.error('❌ Google login failed');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Rethrow with user-friendly message
    const userMessage = getErrorMessage(error.code);
    throw new Error(userMessage);
  }
}

/**
 * ===== FACEBOOK LOGIN =====
 */
export async function loginWithFacebook() {
  try {
    console.log('🔵 Starting Facebook login...');
    
    const provider = new FacebookAuthProvider();
    
    // Request specific scopes (optional)
    // Note: email scope may require app review - using public_profile only
    provider.addScope('public_profile');
    
    const result = await signInWithPopup(auth, provider);
    
    console.log('✅ Facebook login successful!');
    console.log('User:', {
      uid: result.user.uid,
      email: result.user.email,
      name: result.user.displayName,
    });
    
    return result.user;
  } catch (error) {
    console.error('❌ Facebook login failed');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    const userMessage = getErrorMessage(error.code);
    throw new Error(userMessage);
  }
}

/**
 * ===== EMAIL/PASSWORD SIGNUP =====
 */
export async function signUpWithEmail(email, password) {
  try {
    console.log('🔵 Starting email signup...');
    
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    console.log('✅ Signup successful!');
    console.log('User:', {
      uid: result.user.uid,
      email: result.user.email,
    });
    
    return result.user;
  } catch (error) {
    console.error('❌ Signup failed');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    const userMessage = getErrorMessage(error.code);
    throw new Error(userMessage);
  }
}

/**
 * ===== EMAIL/PASSWORD LOGIN =====
 */
export async function loginWithEmail(email, password) {
  try {
    console.log('🔵 Starting email login...');
    
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    console.log('✅ Email login successful!');
    console.log('User:', result.user.email);
    
    return result.user;
  } catch (error) {
    console.error('❌ Email login failed');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    const userMessage = getErrorMessage(error.code);
    throw new Error(userMessage);
  }
}

/**
 * ===== PHONE LOGIN - SEND OTP =====
 * @param {string} phoneNumber - Format: +1234567890
 */
export async function sendPhoneOTP(phoneNumber) {
  try {
    console.log('🔵 Sending OTP to:', phoneNumber);
    
    // Create reCAPTCHA verifier
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          console.log('✅ reCAPTCHA verified');
        },
        'expired-callback': () => {
          console.warn('⚠️ reCAPTCHA token expired');
          window.recaptchaVerifier.clear();
        }
      }, auth);
    }
    
    // Send OTP
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      window.recaptchaVerifier
    );
    
    console.log('✅ OTP sent successfully to:', phoneNumber);
    return confirmationResult;
  } catch (error) {
    console.error('❌ Failed to send OTP');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Clear verifier on error
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    
    const userMessage = getErrorMessage(error.code) || 'Failed to send OTP. Check phone number format.';
    throw new Error(userMessage);
  }
}

/**
 * ===== PHONE LOGIN - VERIFY OTP =====
 * @param {object} confirmationResult - Result from sendPhoneOTP()
 * @param {string} code - 6-digit OTP code
 */
export async function verifyPhoneOTP(confirmationResult, code) {
  try {
    console.log('🔵 Verifying OTP...');
    
    if (!confirmationResult) {
      throw new Error('No OTP request found. Please send OTP first.');
    }
    
    const result = await confirmationResult.confirm(code);
    
    console.log('✅ OTP verified successfully!');
    console.log('User:', {
      uid: result.user.uid,
      phoneNumber: result.user.phoneNumber,
    });
    
    // Clear verifier
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    
    return result.user;
  } catch (error) {
    console.error('❌ OTP verification failed');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    let userMessage = 'Invalid OTP code. Please try again.';
    if (error.code === 'auth/invalid-verification-code') {
      userMessage = 'Invalid OTP code. Please check and try again.';
    } else if (error.code === 'auth/code-expired') {
      userMessage = 'OTP code expired. Please request a new one.';
    }
    
    throw new Error(userMessage);
  }
}

/**
 * ===== LOGOUT =====
 */
export async function logout() {
  try {
    console.log('🔵 Logging out...');
    
    await signOut(auth);
    
    console.log('✅ Logout successful!');
    return true;
  } catch (error) {
    console.error('❌ Logout failed');
    console.error('Error:', error.message);
    throw new Error('Failed to logout: ' + error.message);
  }
}

/**
 * ===== UTILITY: Get Current User =====
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * ===== UTILITY: Check if User is Logged In =====
 */
export function isLoggedIn() {
  return auth.currentUser !== null;
}

/**
 * ===== UTILITY: Listen to Auth State Changes =====
 * @param {function} callback - Called with user object
 * @returns {function} Unsubscribe function
 */
import { onAuthStateChanged } from 'firebase/auth';

export function listenToAuthState(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('👤 User logged in:', user.email || user.phoneNumber);
    } else {
      console.log('👤 User logged out');
    }
    callback(user);
  });
}
