import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  RecaptchaVerifier,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from 'firebase/auth';
import { auth, hasRequiredFirebaseConfig } from '../config/firebase';
import { initSocketConnection, disconnectSocket } from '../services/socketIO';
import { buildApiUrl, profileAPI } from '../services/api';

// Create Auth Context
const AuthContext = createContext(null);
const OAUTH_PROVIDER_STORAGE_KEY = 'duotalk-oauth-provider';

/**
 * Auth Provider Component
 * Handles all authentication operations:
 * - Email/Password authentication
 * - Google OAuth sign-in
 * - Facebook OAuth sign-in
 * - Phone number (OTP) authentication
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(null); // For phone OTP verification
  const [loggedInUsers, setLoggedInUsers] = useState([]); // Array of all logged-in users
  const [currentUserId, setCurrentUserId] = useState(null); // Current active user ID
  const [socketInitialized, setSocketInitialized] = useState(false); // Track socket initialization

  const makeLocalAuthUser = (apiUser, token) => {
    if (!apiUser || !token) return null;

    return {
      ...apiUser,
      uid: apiUser.uid || apiUser.firebaseUID || apiUser.id,
      firebaseUID: apiUser.firebaseUID || apiUser.uid || apiUser.id,
      displayName: apiUser.displayName || apiUser.name || apiUser.username || 'DuoTalk User',
      photoURL: apiUser.photoURL || apiUser.profileImage || '',
      providerId: 'password',
      isLocalAuth: true,
      async getIdToken() {
        return token;
      },
    };
  };

  const ensureFirebaseAuthAvailable = () => {
    if (auth) {
      return true;
    }

    const message = hasRequiredFirebaseConfig
      ? 'Authentication is temporarily unavailable.'
      : 'Firebase authentication is not configured yet. Add the VITE_FIREBASE_* values to enable login.';

    setError(message);
    toast.error(message, {
      position: 'top-right',
      autoClose: 3000,
    });
    return false;
  };

  const syncOAuthUser = async (firebaseUser) => {
    if (!firebaseUser?.uid || !firebaseUser?.email) {
      return firebaseUser;
    }

    try {
      const savedProfile = await profileAPI.syncGoogleUser(firebaseUser);
      return {
        ...firebaseUser,
        firebaseUID: savedProfile?.firebaseUID || firebaseUser.uid,
        username: savedProfile?.username,
        profileImage: savedProfile?.profileImage || firebaseUser.photoURL || '',
      };
    } catch (err) {
      console.error('Error syncing OAuth user:', err);
      return firebaseUser;
    }
  };

  /**
   * Load previously saved user sessions from localStorage
   */
  useEffect(() => {
    const savedUsers = localStorage.getItem('loggedInUsers');
    if (savedUsers) {
      try {
        setLoggedInUsers(JSON.parse(savedUsers));
      } catch (err) {
        console.error('Error loading saved users:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      try {
        const savedToken = localStorage.getItem('authToken') || localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
        const localUser = makeLocalAuthUser(parsedUser, savedToken);
        setUser(localUser);
      } catch (err) {
        console.error('Error restoring local auth session:', err);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      return undefined;
    }

    let active = true;

    const resolveRedirectSignIn = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!active || !result?.user) return;

        const syncedUser = await syncOAuthUser(result.user);
        if (!active) return;

        setUser(syncedUser);
        sessionStorage.removeItem(OAUTH_PROVIDER_STORAGE_KEY);
        toast.success(`Welcome ${result.user.displayName || 'User'}!`, {
          position: 'top-right',
          autoClose: 2000,
        });
      } catch (err) {
        if (!active) return;

        sessionStorage.removeItem(OAUTH_PROVIDER_STORAGE_KEY);
        const errorMessage = formatErrorMessage(err);
        setError(errorMessage);
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    };

    resolveRedirectSignIn();

    return () => {
      active = false;
    };
  }, []);

  /**
   * Monitor auth state changes
   * This runs once when component mounts and sets up a listener
   * that will update whenever the user logs in/out
   */
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const nextUser = await syncOAuthUser(currentUser);

        // Check if this user is already in our logged-in users list
        setLoggedInUsers(prevUsers => {
          const userExists = prevUsers.some(u => u.uid === currentUser.uid);
          if (!userExists) {
            const newUsers = [...prevUsers, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              loginTime: new Date().toISOString()
            }];
            localStorage.setItem('loggedInUsers', JSON.stringify(newUsers));
            return newUsers;
          }
          return prevUsers;
        });
        
        setUser(nextUser);
        
        // Set as current user if none selected
        if (!currentUserId) {
          setCurrentUserId(currentUser.uid);
        }
        
        // Initialize real-time socket connection only once for this user
        if (!socketInitialized) {
          try {
            initSocketConnection();
            setSocketInitialized(true);
            if (import.meta.env.DEV) {
              console.log('🔌 Socket.IO connection initialized for real-time messaging');
            }
          } catch (err) {
            console.error('Failed to initialize socket connection:', err);
          }
        }
      } else {
        setUser(null);
        setSocketInitialized(false);
        // Disconnect socket when user logs out
        try {
          disconnectSocket();
          if (import.meta.env.DEV) {
            console.log('🔌 Socket.IO disconnected on logout');
          }
        } catch (err) {
          console.error('Error disconnecting socket:', err);
        }
      }
      setLoading(false);
      
      if (import.meta.env.DEV) {
        console.log('👤 Auth state changed:', currentUser ? `${currentUser.email}` : 'logged out');
      }
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  /**
   * Helper function to format error messages
   * Makes Firebase errors more user-friendly
   */
  const formatErrorMessage = (error) => {
    const errorMap = {
      'auth/user-not-found': 'User not found. Please check your email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'Email already registered. Please sign in instead.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/operation-not-allowed': 'This operation is not enabled. Please contact support.',
      'auth/too-many-requests': 'Too many login attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/api-key-not-valid': 'Configuration error. Please check your Firebase setup.',
      'auth/invalid-api-key': 'API Key error. Please verify your .env.local file.',
      'auth/unauthorized-domain': `This app origin is not authorized in Firebase. Add ${window.location.hostname} in Firebase Console > Authentication > Settings > Authorized domains.`,
      'auth/popup-closed-by-user': 'Login was cancelled.',
      'auth/cancelled-popup-request': 'Login popup was cancelled.',
    };
    return errorMap[error.code] || error.message || 'An unexpected error occurred';
  };

  /**
   * Email and password sign up
   * Creates a new user account with email/password
   */
  const signUpWithEmail = async ({ username, email, password }) => {
    if (!auth) {
      try {
        setError(null);
        setLoading(true);

        const response = await fetch(buildApiUrl('/auth/register'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            name: username,
            email,
            password,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Could not create account');
        }

        const localUser = makeLocalAuthUser(data.user, data.token);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(localUser);

        toast.success('Account created successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });

        return localUser;
      } catch (err) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);
        toast.error(`âŒ ${errorMessage}`, {
          position: 'top-right',
          autoClose: 3000,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    }

    if (!ensureFirebaseAuthAvailable()) return null;
    try {
      setError(null);
      setLoading(true);
      
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with username
      if (username?.trim()) {
        await updateProfile(result.user, { displayName: username.trim() });
      }

      setUser(result.user);
      toast.success(`✅ Account created successfully!`, {
        position: 'top-right',
        autoClose: 3000,
      });
      
      return result.user;
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`, {
        position: 'top-right',
        autoClose: 3000,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Email and password sign in
   * Authenticates user with email/password credentials
   */
  const signInWithEmail = async ({ email, password }) => {
    if (!auth) {
      try {
        setError(null);
        setLoading(true);

        const response = await fetch(buildApiUrl('/auth/login'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Authentication failed');
        }

        const localUser = makeLocalAuthUser(data.user, data.token);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(localUser);

        toast.success(`Welcome back, ${localUser.displayName || 'User'}!`, {
          position: 'top-right',
          autoClose: 2000,
        });

        return localUser;
      } catch (err) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);
        toast.error(`âŒ ${errorMessage}`, {
          position: 'top-right',
          autoClose: 3000,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    }

    if (!ensureFirebaseAuthAvailable()) return null;
    try {
      setError(null);
      setLoading(true);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
      toast.success(`👋 Welcome back, ${result.user.displayName || 'User'}!`, {
        position: 'top-right',
        autoClose: 2000,
      });
      
      return result.user;
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`, {
        position: 'top-right',
        autoClose: 3000,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send OTP to Phone
   * Initiates phone authentication by sending OTP code
   * 
   * @param {string} phoneNumber - Phone number in international format (e.g., +1234567890)
   * @returns {Promise} confirmationResult for verifying OTP
   */
  const sendPhoneOTP = async (phoneNumber) => {
    if (!ensureFirebaseAuthAvailable()) return null;
    try {
      setError(null);
      setLoading(true);

      // Validate phone number format
      if (!phoneNumber || phoneNumber.length < 10) {
        throw new Error('Please enter a valid phone number');
      }

      // Clear any existing reCAPTCHA verifier
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }

      // Setup reCAPTCHA verifier for phone authentication
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          if (import.meta.env.DEV) {
            console.log('✅ reCAPTCHA resolved:', response ? 'success' : 'failed');
          }
        },
        'expired-callback': () => {
          setError('reCAPTCHA token expired. Please try again.');
          toast.error('❌ reCAPTCHA expired. Please try again.', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      }, auth);

      // Send OTP
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        window.recaptchaVerifier
      );
      
      setConfirming(confirmationResult);
      toast.info('📱 OTP sent to your phone number', {
        position: 'top-right',
        autoClose: 2000,
      });
      
      return confirmationResult;
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      
      // Clear reCAPTCHA on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
      
      toast.error(`❌ ${errorMessage}`, {
        position: 'top-right',
        autoClose: 3000,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify OTP Code
   * Confirms the OTP code sent to user's phone
   * 
   * @param {string} code - 6-digit OTP code from user's phone
   * @returns {Promise} User object on success
   */
  const verifyPhoneOTP = async (code) => {
    if (!ensureFirebaseAuthAvailable()) return null;
    try {
      setError(null);
      setLoading(true);
      
      if (!confirming) {
        throw new Error('No OTP request in progress. Please request a new OTP.');
      }

      if (!code || code.length !== 6) {
        throw new Error('Please enter a valid 6-digit code');
      }

      const result = await confirming.confirm(code);
      setUser(result.user);
      setConfirming(null);
      
      toast.success('✅ Phone verified successfully!', {
        position: 'top-right',
        autoClose: 2000,
      });
      
      return result.user;
    } catch (err) {
      const errorMessage = err.code === 'auth/invalid-verification-code'
        ? 'Invalid OTP code. Please try again.'
        : formatErrorMessage(err);
      
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`, {
        position: 'top-right',
        autoClose: 3000,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign in with Google
   * Opens Google Sign-In popup for OAuth authentication
   * 
   * IMPORTANT: Requires Google OAuth Client ID to be configured in Firebase Console
   * Firebase Console → Authentication → Sign-in method → Google
   */
  const signInWithGoogle = async () => {
    if (!ensureFirebaseAuthAvailable()) return null;
    try {
      setError(null);
      setLoading(true);
      
      const provider = new GoogleAuthProvider();
      
      // Configure scopes (optional - for additional user data)
      provider.addScope('profile');
      provider.addScope('email');
      
      // Force account selection - allows user to pick from multiple Gmail accounts
      provider.setCustomParameters({
        'prompt': 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const syncedUser = await syncOAuthUser(result.user);
      setUser(syncedUser);
      return syncedUser;
    } catch (err) {
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        sessionStorage.setItem(OAUTH_PROVIDER_STORAGE_KEY, 'google');
        toast.info('Opening Google sign-in…', {
          position: 'top-right',
          autoClose: 2000,
        });
        await signInWithRedirect(auth, provider);
        return null;
      }

      // Handle specific Google auth errors
      let errorMessage = 'Google login failed';
      
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Login cancelled. Please try again.';
      } else if (err.code === 'auth/invalid-client-id') {
        errorMessage = 'Google OAuth not configured. Check Firebase Console.';
      } else if (err.code === 'auth/api-key-not-valid') {
        errorMessage = 'Firebase configuration error. Check your API key.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google Sign-In not enabled in Firebase';
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMessage = `This app origin is not authorized in Firebase. Add ${window.location.hostname} in Firebase Console > Authentication > Settings > Authorized domains.`;
      } else {
        errorMessage = formatErrorMessage(err);
      }
      
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`, {
        position: 'top-right',
        autoClose: 3000,
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign in with Facebook
   * Opens Facebook Sign-In popup for OAuth authentication
   * 
   * IMPORTANT: Requires Facebook App ID to be configured in Firebase Console
   * Firebase Console → Authentication → Sign-in method → Facebook
   */
  const signInWithFacebook = async () => {
    if (!ensureFirebaseAuthAvailable()) return null;
    try {
      setError(null);
      setLoading(true);
      
      const provider = new FacebookAuthProvider();
      
      // Configure scopes (optional - for additional user data)
      provider.addScope('email');
      provider.addScope('public_profile');
      
      const result = await signInWithPopup(auth, provider);
      const syncedUser = await syncOAuthUser(result.user);
      setUser(syncedUser);
      return syncedUser;
    } catch (err) {
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        sessionStorage.setItem(OAUTH_PROVIDER_STORAGE_KEY, 'facebook');
        toast.info('Opening Facebook sign-in…', {
          position: 'top-right',
          autoClose: 2000,
        });
        await signInWithRedirect(auth, provider);
        return null;
      }

      // Handle specific Facebook auth errors
      let errorMessage = 'Facebook login failed';
      
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Login cancelled. Please try again.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Facebook Sign-In not enabled in Firebase';
      } else {
        errorMessage = formatErrorMessage(err);
      }
      
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`, {
        position: 'top-right',
        autoClose: 3000,
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout
   * Signs out the current user and clears auth state
   */
  const logout = async (userUid = null) => {
    try {
      setError(null);
      setLoading(true);
      
      // If specific user provided, just remove from logged-in list
      if (userUid) {
        const updatedUsers = loggedInUsers.filter(u => u.uid !== userUid);
        setLoggedInUsers(updatedUsers);
        localStorage.setItem('loggedInUsers', JSON.stringify(updatedUsers));
        
        // If this was the current user, switch to another one
        if (currentUserId === userUid) {
          if (updatedUsers.length > 0) {
            setCurrentUserId(updatedUsers[0].uid);
          } else {
            setCurrentUserId(null);
            if (auth) {
              await signOut(auth);
            }
            setUser(null);
          }
        }
        
        toast.info('👋 User removed', {
          position: 'top-right',
          autoClose: 1500,
        });
      } else {
        // Logout completely
        if (auth) {
          await signOut(auth);
        }
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoggedInUsers([]);
        setCurrentUserId(null);
        localStorage.removeItem('loggedInUsers');
        
        toast.info('👋 Logged out successfully', {
          position: 'top-right',
          autoClose: 2000,
        });
      }
      setConfirming(null);
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      
      toast.error(`❌ ${errorMessage}`, {
        position: 'top-right',
        autoClose: 3000,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Switch between logged-in users
   * @param {string} userUid - The UID of the user to switch to
   */
  const switchUser = (userUid) => {
    const userToSwitch = loggedInUsers.find(u => u.uid === userUid);
    if (userToSwitch) {
      setCurrentUserId(userUid);
      // In a real app, you'd use Firebase's updateCurrentUser or re-authenticate
      toast.info(`👋 Switched to ${userToSwitch.displayName || userToSwitch.email}`, {
        position: 'top-right',
        autoClose: 1500,
      });
    }
  };

  /**
   * Get all logged-in users
   */
  const getAllLoggedInUsers = () => {
    return loggedInUsers;
  };

  /**
   * Get current active user from the logged-in users list
   */
  const getCurrentLoggedInUser = () => {
    return loggedInUsers.find(u => u.uid === currentUserId);
  };

  /**
   * Clear error state manually
   */
  const clearError = () => setError(null);

  // Context value object with all auth methods
  const value = {
    user,
    loading,
    error,
    confirming,
    loggedInUsers,
    currentUserId,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInWithFacebook,
    sendPhoneOTP,
    verifyPhoneOTP,
    logout,
    switchUser,
    getAllLoggedInUsers,
    getCurrentLoggedInUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use Auth Context
 * 
 * @returns {Object} Auth context with all methods and state
 * @throws {Error} If used outside AuthProvider
 * 
 * @example
 * const { user, signInWithGoogle, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};






