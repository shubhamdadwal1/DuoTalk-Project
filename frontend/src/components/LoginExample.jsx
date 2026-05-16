/**
 * Example Login Component
 * Shows how to use the auth functions
 * 
 * Usage in your app:
 * import LoginExample from './LoginExample';
 * <LoginExample />
 */

import React, { useState } from 'react';
import {
  loginWithGoogle,
  loginWithFacebook,
  loginWithEmail,
  signUpWithEmail,
  sendPhoneOTP,
  verifyPhoneOTP,
  logout,
  getCurrentUser,
  isLoggedIn,
} from './authFunctions';

export default function LoginExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);

  // === GOOGLE LOGIN ===
  const handleGoogleLogin = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      const user = await loginWithGoogle();
      setCurrentUser(user);
      setSuccessMessage('✅ Google login successful! ' + user.email);
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // === FACEBOOK LOGIN ===
  const handleFacebookLogin = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      const user = await loginWithFacebook();
      setCurrentUser(user);
      setSuccessMessage('✅ Facebook login successful! ' + user.email);
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // === EMAIL LOGIN ===
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      if (!email || !password) {
        throw new Error('Email and password required');
      }
      
      const user = await loginWithEmail(email, password);
      setCurrentUser(user);
      setSuccessMessage('✅ Email login successful! ' + user.email);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // === EMAIL SIGNUP ===
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      if (!email || !password) {
        throw new Error('Email and password required');
      }
      
      const user = await signUpWithEmail(email, password);
      setCurrentUser(user);
      setSuccessMessage('✅ Signup successful! ' + user.email);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // === PHONE OTP - SEND ===
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      if (!phoneNumber) {
        throw new Error('Phone number required');
      }
      
      // Format: +1234567890
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : '+1' + phoneNumber.replace(/\D/g, '');
      
      const result = await sendPhoneOTP(formattedPhone);
      setConfirmationResult(result);
      setShowPhoneOTP(true);
      setSuccessMessage('✅ OTP sent! Check your phone.');
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // === PHONE OTP - VERIFY ===
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      if (!otpCode) {
        throw new Error('OTP code required');
      }
      
      if (!confirmationResult) {
        throw new Error('No OTP request found');
      }
      
      const user = await verifyPhoneOTP(confirmationResult, otpCode);
      setCurrentUser(user);
      setSuccessMessage('✅ Phone login successful! ' + user.phoneNumber);
      setPhoneNumber('');
      setOtpCode('');
      setShowPhoneOTP(false);
      setConfirmationResult(null);
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // === LOGOUT ===
  const handleLogout = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      await logout();
      setCurrentUser(null);
      setSuccessMessage('✅ Logged out successfully');
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // === RENDER ===
  const styles = {
    container: {
      maxWidth: '500px',
      margin: '50px auto',
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif',
    },
    title: {
      textAlign: 'center',
      marginBottom: '20px',
      color: '#333',
    },
    section: {
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: '#f9f9f9',
      borderRadius: '5px',
    },
    input: {
      width: '100%',
      padding: '10px',
      marginBottom: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      boxSizing: 'border-box',
    },
    button: {
      width: '100%',
      padding: '10px',
      marginBottom: '10px',
      backgroundColor: '#4285F4',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
    },
    buttonGreen: {
      backgroundColor: '#34A853',
    },
    buttonRed: {
      backgroundColor: '#EA4335',
    },
    error: {
      padding: '10px',
      marginBottom: '10px',
      backgroundColor: '#ffebee',
      color: '#c62828',
      borderRadius: '4px',
      border: '1px solid #ef5350',
    },
    success: {
      padding: '10px',
      marginBottom: '10px',
      backgroundColor: '#e8f5e9',
      color: '#2e7d32',
      borderRadius: '4px',
      border: '1px solid #66bb6a',
    },
    userInfo: {
      padding: '10px',
      backgroundColor: '#e3f2fd',
      borderRadius: '4px',
      border: '1px solid #64b5f6',
      marginBottom: '10px',
    },
  };

  // If logged in, show user info
  if (currentUser) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>✅ Logged In</h1>
        
        <div style={styles.userInfo}>
          <p><strong>UID:</strong> {currentUser.uid}</p>
          <p><strong>Email:</strong> {currentUser.email || 'N/A'}</p>
          <p><strong>Phone:</strong> {currentUser.phoneNumber || 'N/A'}</p>
          <p><strong>Display Name:</strong> {currentUser.displayName || 'N/A'}</p>
          <p><strong>Photo:</strong> {currentUser.photoURL ? '✅' : '❌'}</p>
        </div>
        
        <button
          style={{ ...styles.button, ...styles.buttonRed }}
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    );
  }

  // Login form
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔐 Firebase Login</h1>

      {error && <div style={styles.error}>{error}</div>}
      {successMessage && <div style={styles.success}>{successMessage}</div>}

      {/* === SOCIAL LOGIN === */}
      <div style={styles.section}>
        <h3>Social Login</h3>
        
        <button
          style={styles.button}
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? '⏳ Loading...' : '🔵 Continue with Google'}
        </button>

        <button
          style={{ ...styles.button, backgroundColor: '#1877F2' }}
          onClick={handleFacebookLogin}
          disabled={loading}
        >
          {loading ? '⏳ Loading...' : '🔵 Continue with Facebook'}
        </button>
      </div>

      {/* === EMAIL LOGIN/SIGNUP === */}
      <div style={styles.section}>
        <h3>Email/Password</h3>
        
        <form onSubmit={handleEmailLogin}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button
            style={styles.button}
            type="submit"
            disabled={loading}
          >
            {loading ? '⏳ Loading...' : 'Sign In'}
          </button>
        </form>

        <button
          style={{ ...styles.button, ...styles.buttonGreen }}
          onClick={handleEmailSignup}
          disabled={loading}
        >
          {loading ? '⏳ Loading...' : 'Sign Up'}
        </button>
      </div>

      {/* === PHONE OTP === */}
      <div style={styles.section}>
        <h3>Phone Login</h3>
        
        {!showPhoneOTP ? (
          <form onSubmit={handleSendOTP}>
            <input
              style={styles.input}
              type="tel"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
            />
            <button
              style={styles.button}
              type="submit"
              disabled={loading}
            >
              {loading ? '⏳ Loading...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <p>Enter 6-digit code sent to {phoneNumber}</p>
            <input
              style={styles.input}
              type="text"
              placeholder="000000"
              maxLength="6"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
            />
            <button
              style={styles.button}
              type="submit"
              disabled={loading}
            >
              {loading ? '⏳ Loading...' : 'Verify OTP'}
            </button>
            <button
              style={{ ...styles.button, backgroundColor: '#999' }}
              type="button"
              onClick={() => {
                setShowPhoneOTP(false);
                setOtpCode('');
              }}
              disabled={loading}
            >
              Back
            </button>
          </form>
        )}
      </div>

      {/* === RECAPTCHA CONTAINER === */}
      <div id="recaptcha-container"></div>

      {/* === DEBUG INFO === */}
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', fontSize: '12px' }}>
        <p>
          💡 <strong>Debug:</strong> Open browser console (F12) for detailed logs
        </p>
        <p>
          💡 <strong>Run:</strong> FirebaseAuthDebug.checkConfig() in console
        </p>
      </div>
    </div>
  );
}
